import { after, NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  appendSanitizedSearchParamsToDestination,
  getSafeRedirectSearchParams,
  resolveLinkDestination,
} from "@/lib/link-redirects";

export const dynamic = "force-dynamic";
const LINK_TRACK_FIELD_MAX_LENGTH = 2048;
const CONTROL_CHAR_PATTERN = /[\u0000-\u001F\u007F]/g;

function toLimitedNullableString(
  value: unknown,
  maxLength = LINK_TRACK_FIELD_MAX_LENGTH
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.replace(CONTROL_CHAR_PATTERN, " ").trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.slice(0, maxLength);
}

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) {
      return first;
    }
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp && realIp.length > 0) {
    return realIp;
  }

  const cloudflareIp = request.headers.get("cf-connecting-ip")?.trim();
  return cloudflareIp && cloudflareIp.length > 0 ? cloudflareIp : "unknown";
}

function getRequestHost(request: NextRequest): string | null {
  const forwardedHost = request.headers.get("x-forwarded-host");
  if (forwardedHost) {
    const first = forwardedHost.split(",")[0]?.trim();
    if (first) {
      return first.toLowerCase();
    }
  }

  const host = request.headers.get("host")?.trim();
  return host && host.length > 0 ? host.toLowerCase() : null;
}

interface LinkClickRecord {
  slug: string,
  destination: string,
  referrer: string | null,
  userAgent: string | null,
  ip: string,
  country: string,
  city: string,
  region: string,
  requestHost: string | null,
  acceptLanguage: string | null,
  sanitizedQueryString: string | null,
}

function buildLinkClickRecord(
  request: NextRequest,
  slug: string,
  destination: string,
  sanitizedQueryString: string | null
): LinkClickRecord {
  return {
    slug,
    destination,
    referrer: toLimitedNullableString(request.headers.get("referer"), 1024),
    userAgent: toLimitedNullableString(request.headers.get("user-agent"), 1024),
    ip: getClientIp(request),
    country:
      request.headers.get("x-vercel-ip-country") ||
      request.headers.get("cf-ipcountry") ||
      "unknown",
    city:
      request.headers.get("x-vercel-ip-city") ||
      request.headers.get("cf-ipcity") ||
      "unknown",
    region: request.headers.get("x-vercel-ip-country-region") || "unknown",
    requestHost: toLimitedNullableString(getRequestHost(request), 255),
    acceptLanguage: toLimitedNullableString(
      request.headers.get("accept-language"),
      255
    ),
    sanitizedQueryString: toLimitedNullableString(sanitizedQueryString, 512),
  };
}

async function recordLinkClick(linkClick: LinkClickRecord) {
  await db.execute({
    sql: `INSERT INTO link_clicks (
      slug,
      destination,
      referrer,
      user_agent,
      ip,
      country,
      city,
      region,
      request_host,
      accept_language,
      query_string
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      linkClick.slug,
      linkClick.destination,
      linkClick.referrer,
      linkClick.userAgent,
      linkClick.ip,
      linkClick.country,
      linkClick.city,
      linkClick.region,
      linkClick.requestHost,
      linkClick.acceptLanguage,
      linkClick.sanitizedQueryString,
    ],
  });
}

function formatLinkClickLocation(city: string, country: string): string {
  const normalizedCity = city.trim();
  const normalizedCountry = country.trim();
  const hasCity = normalizedCity.length > 0 && normalizedCity !== "unknown";
  const hasCountry = normalizedCountry.length > 0 && normalizedCountry !== "unknown";

  if (hasCity && hasCountry) {
    return `${normalizedCity}, ${normalizedCountry}`;
  }

  if (hasCity) {
    return normalizedCity;
  }

  if (hasCountry) {
    return normalizedCountry;
  }

  return "unknown location";
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const destination = resolveLinkDestination(slug);

  if (!destination) {
    return new NextResponse("Link not found", { status: 404 });
  }

  const requestUrl = new URL(request.url);
  const safeSearchParams = getSafeRedirectSearchParams(requestUrl.searchParams);
  const sanitizedQueryString = safeSearchParams.toString() || null;
  const redirectUrl = appendSanitizedSearchParamsToDestination(
    destination,
    safeSearchParams
  );
  const forwardedQueryParamCount = Array.from(safeSearchParams.keys()).length;
  const linkClick = buildLinkClickRecord(
    request,
    slug,
    destination,
    sanitizedQueryString
  );

  after(async () => {
    try {
      await recordLinkClick(linkClick);
      console.log(
        `${slug}'s link got clicked from ${formatLinkClickLocation(
          linkClick.city,
          linkClick.country
        )}`
      );
    } catch (error) {
      console.error("[links.redirect.GET] tracking_failed", {
        slug,
        destination,
        forwardedQueryParamCount,
        error,
      });
    }
  });

  const response = NextResponse.redirect(redirectUrl, { status: 307 });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
