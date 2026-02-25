import type { R2VersionHistory } from "@/lib/types/feedback";

const CLOUDFLARE_GRAPHQL_ENDPOINT = "https://api.cloudflare.com/client/v4/graphql";
const DEFAULT_R2_BUCKET_NAME = "retrace";
const DEFAULT_HISTORY_DAYS = 30;
const MAX_HISTORY_DAYS = 30;

interface CloudflareR2HistoryResult {
  history: R2VersionHistory | null;
  error: string | null;
}

interface R2OperationRow {
  dimensions?: {
    date?: unknown;
    objectName?: unknown;
  };
  sum?: {
    requests?: unknown;
    responseBytes?: unknown;
  };
}

function toCount(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    return 0;
  }
  return Math.max(0, Math.trunc(parsed));
}

function toNullableNonEmpty(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function clampHistoryDays(rawDays: unknown): number {
  const parsed = typeof rawDays === "number" ? rawDays : Number(rawDays);
  if (!Number.isFinite(parsed)) {
    return DEFAULT_HISTORY_DAYS;
  }

  return Math.max(1, Math.min(MAX_HISTORY_DAYS, Math.trunc(parsed)));
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function buildDateRange(historyDays: number): { startIso: string; endIso: string; dates: string[] } {
  const end = new Date();
  end.setUTCHours(23, 59, 59, 999);

  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (historyDays - 1));
  start.setUTCHours(0, 0, 0, 0);

  const dates: string[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    dates.push(toIsoDate(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
    dates,
  };
}

function extractVersionFromObjectName(objectName: string): string {
  const fileName = objectName.split("/").pop() ?? objectName;
  const match = fileName.match(/(?:^|[-_])v?(\d+\.\d+(?:\.\d+)?)/i);
  if (match?.[1]) {
    return match[1];
  }

  return fileName.replace(/\.dmg$/i, "");
}

function sortBySemanticVersionThenName(a: string, b: string): number {
  const aParts = a.split(".").map((part) => Number(part));
  const bParts = b.split(".").map((part) => Number(part));
  const maxLength = Math.max(aParts.length, bParts.length);

  for (let index = 0; index < maxLength; index += 1) {
    const aValue = Number.isFinite(aParts[index]) ? aParts[index] : 0;
    const bValue = Number.isFinite(bParts[index]) ? bParts[index] : 0;
    if (aValue !== bValue) {
      return bValue - aValue;
    }
  }

  return a.localeCompare(b);
}

export async function fetchCloudflareR2VersionHistory(): Promise<CloudflareR2HistoryResult> {
  const apiToken =
    toNullableNonEmpty(process.env.CLOUDFLARE_ANALYTICS_API_TOKEN) ??
    toNullableNonEmpty(process.env.CLOUDFLARE_API_TOKEN);
  const accountId =
    toNullableNonEmpty(process.env.CLOUDFLARE_ACCOUNT_ID) ??
    toNullableNonEmpty(process.env.CF_ACCOUNT_ID);
  const bucketName =
    toNullableNonEmpty(process.env.CLOUDFLARE_R2_ANALYTICS_BUCKET) ??
    toNullableNonEmpty(process.env.CLOUDFLARE_R2_BUCKET) ??
    DEFAULT_R2_BUCKET_NAME;

  if (!apiToken || !accountId) {
    return {
      history: null,
      error: "Cloudflare analytics is not configured (missing CLOUDFLARE_ANALYTICS_API_TOKEN/CLOUDFLARE_ACCOUNT_ID).",
    };
  }

  const historyDays = clampHistoryDays(process.env.CLOUDFLARE_R2_ANALYTICS_DAYS);
  const { startIso, endIso, dates } = buildDateRange(historyDays);

  const query = `
    query GetR2VersionProgression(
      $accountTag: string!
      $bucketName: string!
      $start: Time!
      $end: Time!
    ) {
      viewer {
        accounts(filter: { accountTag: $accountTag }) {
          r2OperationsAdaptiveGroups(
            limit: 5000
            filter: {
              bucketName: $bucketName
              actionType: "GetObject"
              responseStatusCode: 200
              objectName_like: "%.dmg"
              datetime_geq: $start
              datetime_leq: $end
            }
            orderBy: [date_ASC, objectName_ASC]
          ) {
            dimensions {
              date
              objectName
            }
            sum {
              requests
              responseBytes
            }
          }
        }
      }
    }
  `;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  try {
    const response = await fetch(CLOUDFLARE_GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        variables: {
          accountTag: accountId,
          bucketName,
          start: startIso,
          end: endIso,
        },
      }),
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      return {
        history: null,
        error: `Cloudflare analytics request failed (${response.status}).`,
      };
    }

    const payload = await response.json() as {
      data?: {
        viewer?: {
          accounts?: Array<{
            r2OperationsAdaptiveGroups?: R2OperationRow[];
          }>;
        };
      };
      errors?: Array<{ message?: string }>;
    };

    if (Array.isArray(payload.errors) && payload.errors.length > 0) {
      const message = payload.errors[0]?.message?.trim() || "Cloudflare analytics query failed.";
      return {
        history: null,
        error: message,
      };
    }

    const groups = payload.data?.viewer?.accounts?.[0]?.r2OperationsAdaptiveGroups ?? [];
    if (!Array.isArray(groups) || groups.length === 0) {
      return {
        history: {
          bucket: bucketName,
          source: "cloudflare_r2",
          metric: "GetObject status=200 requests",
          rangeStart: toIsoDate(new Date(startIso)),
          rangeEnd: toIsoDate(new Date(endIso)),
          versions: [],
          dailyTotals: dates.map((date) => ({ date, requests: 0, responseBytes: 0 })),
        },
        error: null,
      };
    }

    const dailyTotals = new Map<string, { requests: number; responseBytes: number }>();
    const versions = new Map<string, {
      objectName: string;
      version: string;
      totalRequests: number;
      totalResponseBytes: number;
      daily: Map<string, { requests: number; responseBytes: number }>;
    }>();

    for (const date of dates) {
      dailyTotals.set(date, { requests: 0, responseBytes: 0 });
    }

    for (const row of groups) {
      const objectName = toNullableNonEmpty(row.dimensions?.objectName);
      const date = toNullableNonEmpty(row.dimensions?.date);
      if (!objectName || !date) {
        continue;
      }

      const requests = toCount(row.sum?.requests);
      const responseBytes = toCount(row.sum?.responseBytes);

      const day = dailyTotals.get(date) ?? { requests: 0, responseBytes: 0 };
      day.requests += requests;
      day.responseBytes += responseBytes;
      dailyTotals.set(date, day);

      const existing = versions.get(objectName) ?? {
        objectName,
        version: extractVersionFromObjectName(objectName),
        totalRequests: 0,
        totalResponseBytes: 0,
        daily: new Map<string, { requests: number; responseBytes: number }>(),
      };

      existing.totalRequests += requests;
      existing.totalResponseBytes += responseBytes;
      const dailyPoint = existing.daily.get(date) ?? { requests: 0, responseBytes: 0 };
      dailyPoint.requests += requests;
      dailyPoint.responseBytes += responseBytes;
      existing.daily.set(date, dailyPoint);
      versions.set(objectName, existing);
    }

    const versionRows = Array.from(versions.values())
      .sort((left, right) => {
        const versionOrder = sortBySemanticVersionThenName(left.version, right.version);
        if (versionOrder !== 0) {
          return versionOrder;
        }
        return right.totalRequests - left.totalRequests;
      })
      .map((entry) => ({
        objectName: entry.objectName,
        version: entry.version,
        totalRequests: entry.totalRequests,
        totalResponseBytes: entry.totalResponseBytes,
        daily: dates.map((date) => {
          const point = entry.daily.get(date) ?? { requests: 0, responseBytes: 0 };
          return {
            date,
            requests: point.requests,
            responseBytes: point.responseBytes,
          };
        }),
      }));

    return {
      history: {
        bucket: bucketName,
        source: "cloudflare_r2",
        metric: "GetObject status=200 requests",
        rangeStart: toIsoDate(new Date(startIso)),
        rangeEnd: toIsoDate(new Date(endIso)),
        versions: versionRows,
        dailyTotals: dates.map((date) => {
          const point = dailyTotals.get(date) ?? { requests: 0, responseBytes: 0 };
          return {
            date,
            requests: point.requests,
            responseBytes: point.responseBytes,
          };
        }),
      },
      error: null,
    };
  } catch (error) {
    const isAbortError =
      error instanceof Error &&
      (error.name === "AbortError" || error.name === "TimeoutError");
    return {
      history: null,
      error: isAbortError
        ? "Cloudflare analytics request timed out."
        : `Cloudflare analytics request failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  } finally {
    clearTimeout(timeout);
  }
}
