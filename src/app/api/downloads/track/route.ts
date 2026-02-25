import { db, initDatabase } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireApiBearerAuth } from "@/lib/api-auth";
import { getDownloadAnalyticsPayload } from "@/lib/download-analytics";
import { createApiRouteLogger } from "@/lib/api-route-logger";

// Ensure table exists on first request
let dbInitialized = false;
const DOWNLOAD_TRACK_WINDOW_MS = 5 * 60 * 1000;
const DOWNLOAD_TRACK_MAX_REQUESTS = 40;
const DOWNLOAD_TRACK_DEDUP_WINDOW_MS = 30 * 1000;
const DOWNLOAD_TRACK_MAX_CONTENT_LENGTH = 10 * 1024;
const DOWNLOAD_TRACK_FIELD_MAX_LENGTH = 256;

const downloadTrackRateLimits = new Map<string, { count: number; windowStart: number }>();
const recentDownloadFingerprints = new Map<string, number>();

function toLimitedNullableString(
  value: unknown,
  maxLength = DOWNLOAD_TRACK_FIELD_MAX_LENGTH
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
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
  return realIp && realIp.length > 0 ? realIp : "unknown";
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

function isAllowedTrackOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) {
    return true;
  }

  const requestHost = getRequestHost(request);
  if (!requestHost) {
    return true;
  }

  try {
    return new URL(origin).host.toLowerCase() === requestHost;
  } catch {
    return false;
  }
}

function exceedsTrackContentLength(request: NextRequest): boolean {
  const rawContentLength = request.headers.get("content-length");
  if (!rawContentLength) {
    return false;
  }

  const parsed = Number(rawContentLength);
  return Number.isFinite(parsed) && parsed > DOWNLOAD_TRACK_MAX_CONTENT_LENGTH;
}

function clearExpiredTrackRateLimits(now: number): void {
  for (const [ip, record] of downloadTrackRateLimits.entries()) {
    if (now - record.windowStart >= DOWNLOAD_TRACK_WINDOW_MS * 2) {
      downloadTrackRateLimits.delete(ip);
    }
  }
}

function checkTrackRateLimit(ip: string): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  clearExpiredTrackRateLimits(now);

  const record = downloadTrackRateLimits.get(ip);
  if (!record || now - record.windowStart >= DOWNLOAD_TRACK_WINDOW_MS) {
    downloadTrackRateLimits.set(ip, { count: 1, windowStart: now });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (record.count >= DOWNLOAD_TRACK_MAX_REQUESTS) {
    const retryAfterMs = DOWNLOAD_TRACK_WINDOW_MS - (now - record.windowStart);
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)),
    };
  }

  record.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

function clearExpiredFingerprints(now: number): void {
  for (const [fingerprint, timestamp] of recentDownloadFingerprints.entries()) {
    if (now - timestamp >= DOWNLOAD_TRACK_DEDUP_WINDOW_MS) {
      recentDownloadFingerprints.delete(fingerprint);
    }
  }
}

function isDuplicateTrackEvent(fingerprint: string): boolean {
  const now = Date.now();
  clearExpiredFingerprints(now);

  const previous = recentDownloadFingerprints.get(fingerprint);
  recentDownloadFingerprints.set(fingerprint, now);

  return previous !== undefined && now - previous < DOWNLOAD_TRACK_DEDUP_WINDOW_MS;
}

async function parseTrackPayload(request: NextRequest): Promise<Record<string, unknown> | null> {
  try {
    const parsed = await request.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }

    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const logger = createApiRouteLogger("downloads.track.POST", { request });
  logger.start();

  if (!isAllowedTrackOrigin(request)) {
    logger.warn("invalid_origin", { status: 403 });
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  if (exceedsTrackContentLength(request)) {
    logger.warn("payload_too_large", { status: 413 });
    return NextResponse.json(
      { error: "Request body too large" },
      { status: 413 }
    );
  }

  const ip = getClientIp(request);
  const rateLimit = checkTrackRateLimit(ip);
  if (!rateLimit.allowed) {
    logger.warn("rate_limited", {
      status: 429,
      ip,
      retryAfterSeconds: rateLimit.retryAfterSeconds,
    });
    return NextResponse.json(
      {
        error: "Too many tracking requests. Please retry later.",
        retryAfter: rateLimit.retryAfterSeconds,
      },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      }
    );
  }

  const payload = await parseTrackPayload(request);
  if (!payload) {
    logger.warn("invalid_request_body", { status: 400, ip });
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    // Initialize database on first request
    if (!dbInitialized) {
      await initDatabase();
      dbInitialized = true;
    }

    const {
      version,
      source,
      os,
      osVersion,
      browser,
      browserVersion,
      architecture,
      platform,
      language,
      screenResolution,
      timezone,
      referrer,
      userAgent,
    } = payload;

    // Get IP and geo info from request headers (works with Vercel/Cloudflare)
    const country =
      request.headers.get("x-vercel-ip-country") ||
      request.headers.get("cf-ipcountry") ||
      "unknown";
    const city =
      request.headers.get("x-vercel-ip-city") ||
      request.headers.get("cf-ipcity") ||
      "unknown";
    const region =
      request.headers.get("x-vercel-ip-country-region") || "unknown";

    const normalizedVersion = toLimitedNullableString(version, 64);
    const normalizedSource = toLimitedNullableString(source, 64);
    const normalizedOs = toLimitedNullableString(os, 64);
    const normalizedOsVersion = toLimitedNullableString(osVersion, 64);
    const normalizedBrowser = toLimitedNullableString(browser, 64);
    const normalizedBrowserVersion = toLimitedNullableString(browserVersion, 64);
    const normalizedArchitecture = toLimitedNullableString(architecture, 64);
    const normalizedPlatform = toLimitedNullableString(platform, 64);
    const normalizedLanguage = toLimitedNullableString(language, 32);
    const normalizedScreenResolution = toLimitedNullableString(screenResolution, 32);
    const normalizedTimezone = toLimitedNullableString(timezone, 64);
    const normalizedReferrer = toLimitedNullableString(referrer, 1024);
    const normalizedUserAgent =
      toLimitedNullableString(
        request.headers.get("user-agent"),
        1024
      ) ?? toLimitedNullableString(userAgent, 1024);

    const dedupeFingerprint = [
      ip,
      normalizedSource ?? "unknown",
      normalizedVersion ?? "unknown",
      normalizedUserAgent ?? "unknown",
    ].join("|");
    if (isDuplicateTrackEvent(dedupeFingerprint)) {
      logger.info("deduplicated", {
        status: 200,
        ip,
        source: normalizedSource ?? "unknown",
        version: normalizedVersion ?? "unknown",
      });
      return NextResponse.json({
        success: true,
        deduplicated: true,
        message: "Download already tracked recently",
      });
    }

    // Insert into database
    await db.execute({
      sql: `INSERT INTO downloads (
        version, source, os, os_version, browser, browser_version,
        architecture, platform, language, screen_resolution, timezone,
        referrer, user_agent, ip, country, city, region
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        normalizedVersion,
        normalizedSource,
        normalizedOs,
        normalizedOsVersion,
        normalizedBrowser,
        normalizedBrowserVersion,
        normalizedArchitecture,
        normalizedPlatform,
        normalizedLanguage,
        normalizedScreenResolution,
        normalizedTimezone,
        normalizedReferrer,
        normalizedUserAgent,
        ip,
        country,
        city,
        region,
      ],
    });

    logger.success({
      status: 200,
      ip,
      source: normalizedSource ?? "unknown",
      version: normalizedVersion ?? "unknown",
      platform: normalizedPlatform ?? "unknown",
    });

    return NextResponse.json({
      success: true,
      message: "Download tracked successfully",
    });
  } catch (error) {
    logger.error("failed", error, { status: 500, ip });
    return NextResponse.json(
      { error: "Failed to track download" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const logger = createApiRouteLogger("downloads.track.GET", { request });
  logger.start();

  const authError = requireApiBearerAuth(request);
  if (authError) {
    logger.warn("auth_failed", { status: authError.status });
    return authError;
  }

  try {
    const payload = await getDownloadAnalyticsPayload();
    logger.success({
      status: 200,
      totalDownloads: payload.totalDownloads,
      recentCount: payload.recent.length,
    });
    return NextResponse.json(payload);
  } catch (error) {
    logger.error("failed", error, { status: 500 });
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
