import { db, initDatabase } from "@/lib/db";

let analyticsDbInitialized = false;

export interface DownloadAnalyticsPayload {
  totalDownloads: number;
  byOs: { os: string; count: number }[];
  bySource: { source: string; count: number }[];
  recent: Array<{
    id: number;
    version: string | null;
    source: string | null;
    os: string | null;
    os_version: string | null;
    browser: string | null;
    browser_version: string | null;
    architecture: string | null;
    platform: string | null;
    language: string | null;
    screen_resolution: string | null;
    timezone: string | null;
    referrer: string | null;
    user_agent: string | null;
    ip: string | null;
    country: string | null;
    city: string | null;
    region: string | null;
    created_at: string;
  }>;
  hourlyDownloads: Array<{ bucket_start: string; count: number }>;
  dailyDownloads: Array<{ bucket_start: string; count: number }>;
}

function toCount(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    return 0;
  }
  return Math.max(0, Math.trunc(parsed));
}

function toNullableString(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  const asString = String(value);
  return asString.length > 0 ? asString : null;
}

async function ensureDownloadAnalyticsInitialized() {
  if (analyticsDbInitialized) {
    return;
  }

  await initDatabase();
  analyticsDbInitialized = true;
}

export async function getDownloadAnalyticsPayload(): Promise<DownloadAnalyticsPayload> {
  await ensureDownloadAnalyticsInitialized();

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
    db.execute(`
      WITH RECURSIVE hour_buckets(bucket_start, step) AS (
        SELECT datetime(strftime('%Y-%m-%d %H:00:00', 'now'), '-47 hours'), 0
        UNION ALL
        SELECT datetime(bucket_start, '+1 hour'), step + 1
        FROM hour_buckets
        WHERE step < 47
      ),
      hour_counts AS (
        SELECT
          strftime('%Y-%m-%d %H:00:00', created_at) AS bucket_start,
          COUNT(*) AS count
        FROM downloads
        WHERE created_at >= datetime(strftime('%Y-%m-%d %H:00:00', 'now'), '-47 hours')
        GROUP BY strftime('%Y-%m-%d %H:00:00', created_at)
      )
      SELECT
        hb.bucket_start,
        COALESCE(hc.count, 0) AS count
      FROM hour_buckets hb
      LEFT JOIN hour_counts hc ON hc.bucket_start = hb.bucket_start
      ORDER BY hb.bucket_start ASC
    `),
    db.execute(`
      WITH RECURSIVE day_buckets(bucket_start, step) AS (
        SELECT date('now', '-29 days'), 0
        UNION ALL
        SELECT date(bucket_start, '+1 day'), step + 1
        FROM day_buckets
        WHERE step < 29
      ),
      day_counts AS (
        SELECT
          date(created_at) AS bucket_start,
          COUNT(*) AS count
        FROM downloads
        WHERE created_at >= date('now', '-29 days')
        GROUP BY date(created_at)
      )
      SELECT
        dbk.bucket_start,
        COALESCE(dc.count, 0) AS count
      FROM day_buckets dbk
      LEFT JOIN day_counts dc ON dc.bucket_start = dbk.bucket_start
      ORDER BY dbk.bucket_start ASC
    `),
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
  const recent = (recentResult.rows as Record<string, unknown>[]).map((row) => ({
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
  const hourlyDownloads = (hourlyResult.rows as Record<string, unknown>[]).map((row) => ({
    bucket_start: String(row.bucket_start ?? ""),
    count: toCount(row.count),
  }));
  const dailyDownloads = (dailyResult.rows as Record<string, unknown>[]).map((row) => ({
    bucket_start: String(row.bucket_start ?? ""),
    count: toCount(row.count),
  }));

  return {
    totalDownloads,
    byOs,
    bySource,
    recent,
    hourlyDownloads,
    dailyDownloads,
  };
}
