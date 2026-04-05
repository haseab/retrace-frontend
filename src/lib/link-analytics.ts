import { db } from "@/lib/db";
import {
  buildDailyBucketQuery,
  buildHourlyBucketQuery,
  mapBucketRows,
  toCount,
  toNullableString,
} from "@/lib/analytics-helpers";
import type { LinkClickItem, SiteAnalytics } from "@/lib/types/feedback";

export type LinkAnalyticsPayload = Required<
  Pick<
    SiteAnalytics,
    | "totalLinkClicks"
    | "byLinkSlug"
    | "recentLinkClicks"
    | "hourlyLinkClicks"
    | "dailyLinkClicks"
  >
>;

export async function getLinkAnalyticsPayload(): Promise<LinkAnalyticsPayload> {
  const [
    totalResult,
    bySlugResult,
    recentResult,
    hourlyResult,
    dailyResult,
  ] = await Promise.all([
    db.execute("SELECT COUNT(*) AS count FROM link_clicks"),
    db.execute(`
      SELECT COALESCE(NULLIF(TRIM(slug), ''), 'unknown') AS slug, COUNT(*) AS count
      FROM link_clicks
      GROUP BY COALESCE(NULLIF(TRIM(slug), ''), 'unknown')
      ORDER BY count DESC
    `),
    db.execute(`
      SELECT
        id,
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
        query_string,
        created_at
      FROM link_clicks
      ORDER BY created_at DESC
      LIMIT 20
    `),
    db.execute(buildHourlyBucketQuery("link_clicks")),
    db.execute(buildDailyBucketQuery("link_clicks")),
  ]);

  const totalLinkClicks = toCount(totalResult.rows[0]?.count);
  const byLinkSlug = (bySlugResult.rows as Record<string, unknown>[]).map((row) => ({
    slug: String(row.slug ?? "unknown"),
    count: toCount(row.count),
  }));
  const recentLinkClicks: LinkClickItem[] = (recentResult.rows as Record<
    string,
    unknown
  >[]).map((row) => ({
    id: toCount(row.id),
    slug: String(row.slug ?? "unknown"),
    destination: toNullableString(row.destination),
    referrer: toNullableString(row.referrer),
    user_agent: toNullableString(row.user_agent),
    ip: toNullableString(row.ip),
    country: toNullableString(row.country),
    city: toNullableString(row.city),
    region: toNullableString(row.region),
    request_host: toNullableString(row.request_host),
    accept_language: toNullableString(row.accept_language),
    query_string: toNullableString(row.query_string),
    created_at: String(row.created_at ?? ""),
  }));
  const hourlyLinkClicks = mapBucketRows(
    hourlyResult.rows as Record<string, unknown>[]
  );
  const dailyLinkClicks = mapBucketRows(
    dailyResult.rows as Record<string, unknown>[]
  );

  return {
    totalLinkClicks,
    byLinkSlug,
    recentLinkClicks,
    hourlyLinkClicks,
    dailyLinkClicks,
  };
}
