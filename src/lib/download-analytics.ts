import { db } from "@/lib/db";
import {
  buildDailyBucketQuery,
  buildHourlyBucketQuery,
  mapBucketRows,
  toCount,
  toNullableString,
} from "@/lib/analytics-helpers";
import type { DownloadItem, SiteAnalytics } from "@/lib/types/feedback";

export type DownloadAnalyticsPayload = Pick<
  SiteAnalytics,
  | "totalDownloads"
  | "byOs"
  | "bySource"
  | "recent"
  | "hourlyDownloads"
  | "dailyDownloads"
>;

export async function getDownloadAnalyticsPayload(): Promise<DownloadAnalyticsPayload> {
  const [
    totalResult,
    byOsResult,
    bySourceResult,
    recentResult,
    hourlyResult,
    dailyResult,
  ] = await Promise.all([
    db.execute("SELECT COUNT(*) as count FROM downloads"),
    db.execute(`
      SELECT COALESCE(NULLIF(TRIM(os), ''), 'unknown') AS os, COUNT(*) as count
      FROM downloads
      GROUP BY COALESCE(NULLIF(TRIM(os), ''), 'unknown')
      ORDER BY count DESC
    `),
    db.execute(`
      SELECT COALESCE(NULLIF(TRIM(source), ''), 'unknown') AS source, COUNT(*) as count
      FROM downloads
      GROUP BY COALESCE(NULLIF(TRIM(source), ''), 'unknown')
      ORDER BY count DESC
    `),
    db.execute(`
      SELECT
        id,
        version,
        source,
        os,
        os_version,
        browser,
        browser_version,
        architecture,
        platform,
        language,
        screen_resolution,
        timezone,
        referrer,
        ip,
        country,
        city,
        region,
        created_at
      FROM downloads
      ORDER BY created_at DESC
      LIMIT 10
    `),
    db.execute(buildHourlyBucketQuery("downloads")),
    db.execute(buildDailyBucketQuery("downloads")),
  ]);

  const totalDownloads = toCount(totalResult.rows[0]?.count);
  const byOs = (byOsResult.rows as Record<string, unknown>[]).map((row) => ({
    os: String(row.os ?? "unknown"),
    count: toCount(row.count),
  }));
  const bySource = (bySourceResult.rows as Record<string, unknown>[]).map((row) => ({
    source: String(row.source ?? "unknown"),
    count: toCount(row.count),
  }));
  const recent: DownloadItem[] = (recentResult.rows as Record<string, unknown>[]).map((row) => ({
    id: toCount(row.id),
    version: toNullableString(row.version),
    source: toNullableString(row.source),
    os: toNullableString(row.os),
    os_version: toNullableString(row.os_version),
    browser: toNullableString(row.browser),
    browser_version: toNullableString(row.browser_version),
    architecture: toNullableString(row.architecture),
    platform: toNullableString(row.platform),
    language: toNullableString(row.language),
    screen_resolution: toNullableString(row.screen_resolution),
    timezone: toNullableString(row.timezone),
    referrer: toNullableString(row.referrer),
    user_agent: null,
    ip: toNullableString(row.ip),
    country: toNullableString(row.country),
    city: toNullableString(row.city),
    region: toNullableString(row.region),
    created_at: String(row.created_at ?? ""),
  }));
  const hourlyDownloads = mapBucketRows(
    hourlyResult.rows as Record<string, unknown>[]
  );
  const dailyDownloads = mapBucketRows(
    dailyResult.rows as Record<string, unknown>[]
  );

  return {
    totalDownloads,
    byOs,
    bySource,
    recent,
    hourlyDownloads,
    dailyDownloads,
  };
}
