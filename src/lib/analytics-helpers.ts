import type { DownloadSeriesPoint } from "@/lib/types/feedback";

type AnalyticsTableName = "downloads" | "link_clicks";

export function toCount(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.max(0, Math.trunc(parsed));
}

export function toNullableString(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const asString = String(value);
  return asString.length > 0 ? asString : null;
}

export function buildHourlyBucketQuery(tableName: AnalyticsTableName): string {
  return `
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
      FROM ${tableName}
      WHERE created_at >= datetime(strftime('%Y-%m-%d %H:00:00', 'now'), '-47 hours')
      GROUP BY strftime('%Y-%m-%d %H:00:00', created_at)
    )
    SELECT
      hb.bucket_start,
      COALESCE(hc.count, 0) AS count
    FROM hour_buckets hb
    LEFT JOIN hour_counts hc ON hc.bucket_start = hb.bucket_start
    ORDER BY hb.bucket_start ASC
  `;
}

export function buildDailyBucketQuery(tableName: AnalyticsTableName): string {
  return `
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
      FROM ${tableName}
      WHERE created_at >= date('now', '-29 days')
      GROUP BY date(created_at)
    )
    SELECT
      dbk.bucket_start,
      COALESCE(dc.count, 0) AS count
    FROM day_buckets dbk
    LEFT JOIN day_counts dc ON dc.bucket_start = dbk.bucket_start
    ORDER BY dbk.bucket_start ASC
  `;
}

export function mapBucketRows(
  rows: Record<string, unknown>[]
): DownloadSeriesPoint[] {
  return rows.map((row) => ({
    bucket_start: String(row.bucket_start ?? ""),
    count: toCount(row.count),
  }));
}
