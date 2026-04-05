export const LINK_DESTINATIONS = {
  "haseab-twitter": "https://x.com/haseab_/",
  "retrace-discord": "https://discord.com/invite/uVYW93cbDY",
  "support-retrace-10h": "https://buymeacoffee.com/haseab",
  "support-retrace-100h": "https://buymeacoffee.com/haseab",
  "support-retrace-1000h": "https://buymeacoffee.com/haseab",
  "support-haseab": "https://buymeacoffee.com/haseab",
} as const;

export type LinkSlug = keyof typeof LINK_DESTINATIONS;

const ALLOWED_REDIRECT_QUERY_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "utm_id",
  "ref",
]);
const MAX_REDIRECT_QUERY_PARAM_VALUE_LENGTH = 120;
const CONTROL_CHAR_PATTERN = /[\u0000-\u001F\u007F]/g;
const SAFE_REDIRECT_QUERY_VALUE_PATTERN = /^[A-Za-z0-9._ -]+$/;

export function resolveLinkDestination(slug: string): string | null {
  return LINK_DESTINATIONS[slug as LinkSlug] ?? null;
}

function sanitizeRedirectQueryValue(value: string): string | null {
  const withoutControlChars = value.replace(CONTROL_CHAR_PATTERN, " ");
  const normalizedWhitespace = withoutControlChars.trim().replace(/\s+/g, " ");

  if (
    !normalizedWhitespace ||
    normalizedWhitespace.length > MAX_REDIRECT_QUERY_PARAM_VALUE_LENGTH
  ) {
    return null;
  }

  return SAFE_REDIRECT_QUERY_VALUE_PATTERN.test(normalizedWhitespace)
    ? normalizedWhitespace
    : null;
}

export function getSafeRedirectSearchParams(
  searchParams: URLSearchParams
): URLSearchParams {
  const filtered = new URLSearchParams();

  for (const [rawKey, rawValue] of searchParams.entries()) {
    const key = rawKey.trim().toLowerCase();
    if (!ALLOWED_REDIRECT_QUERY_PARAMS.has(key) || filtered.has(key)) {
      continue;
    }

    const value = sanitizeRedirectQueryValue(rawValue);
    if (!value) {
      continue;
    }

    filtered.set(key, value);
  }

  return filtered;
}

export function appendSanitizedSearchParamsToDestination(
  destination: string,
  searchParams: URLSearchParams
): string {
  const url = new URL(destination);

  for (const [key, value] of searchParams.entries()) {
    url.searchParams.append(key, value);
  }

  return url.toString();
}
