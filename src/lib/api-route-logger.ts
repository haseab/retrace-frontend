import { inspect } from "node:util";
import { NextRequest } from "next/server";

export type RouteLogMeta = Record<string, unknown>;

type LogLevel = "log" | "warn" | "error";

interface CreateApiRouteLoggerOptions {
  request?: NextRequest;
  method?: string;
}

interface WriteStructuredLogOptions {
  prefix: string;
  event: string;
  summary?: string;
  meta?: RouteLogMeta;
  level?: LogLevel;
  enabled?: boolean;
}

const ENABLE_ADMIN_API_ROUTE_LOGS = process.env.ENABLE_ADMIN_API_ROUTE_LOGS === "true";
const ALWAYS_ENABLED_ROUTE_PATTERNS = [/^feedback\.POST$/, /^feedback\.sync\./];

function toStringValue(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  return null;
}

function extractClientIp(request: NextRequest): string | null {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) {
      return first;
    }
  }

  return (
    toStringValue(request.headers.get("x-real-ip")) ||
    toStringValue(request.headers.get("cf-connecting-ip")) ||
    null
  );
}

function getQueryObject(request: NextRequest): Record<string, string[]> {
  const url = new URL(request.url);
  const keys = Array.from(new Set(Array.from(url.searchParams.keys()))).sort();
  const query: Record<string, string[]> = {};

  for (const key of keys) {
    query[key] = url.searchParams.getAll(key);
  }

  return query;
}

function serializeError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause,
    };
  }

  return { value: String(error) };
}

function cleanLogValue(value: unknown): unknown {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value instanceof Error) {
    return cleanLogValue(serializeError(value));
  }

  if (Array.isArray(value)) {
    const cleanedItems = value
      .map((item) => cleanLogValue(item))
      .filter((item) => item !== undefined);

    return cleanedItems.length > 0 ? cleanedItems : undefined;
  }

  if (typeof value === "object") {
    const cleanedEntries = Object.entries(value).flatMap(([key, item]) => {
      const cleanedItem = cleanLogValue(item);
      return cleanedItem === undefined ? [] : [[key, cleanedItem] as const];
    });

    return cleanedEntries.length > 0 ? Object.fromEntries(cleanedEntries) : undefined;
  }

  return String(value);
}

function cleanLogMeta(meta: RouteLogMeta = {}): RouteLogMeta {
  const cleaned = cleanLogValue(meta);
  return cleaned && typeof cleaned === "object" && !Array.isArray(cleaned)
    ? (cleaned as RouteLogMeta)
    : {};
}

function formatLogMeta(meta: RouteLogMeta = {}): string {
  const cleanedMeta = cleanLogMeta(meta);
  if (Object.keys(cleanedMeta).length === 0) {
    return "";
  }

  return inspect(cleanedMeta, {
    depth: null,
    breakLength: Infinity,
    compact: true,
    colors: false,
    maxArrayLength: 20,
    maxStringLength: 1_200,
  });
}

function createRequestSummary(request: NextRequest): string {
  const url = new URL(request.url);
  return `${request.method} ${url.pathname}${url.search}`;
}

function createRequestMeta(request: NextRequest): RouteLogMeta {
  const query = getQueryObject(request);

  return cleanLogMeta({
    request: {
      query: Object.keys(query).length > 0 ? query : undefined,
      contentType: request.headers.get("content-type") ?? undefined,
      contentLength: request.headers.get("content-length") ?? undefined,
    },
    client: {
      ip: extractClientIp(request) ?? undefined,
      origin: request.headers.get("origin") ?? undefined,
      referer: request.headers.get("referer") ?? undefined,
      userAgent: request.headers.get("user-agent") ?? undefined,
    },
  });
}

function splitOutcomeMeta(meta: RouteLogMeta = {}): { summary: string; meta: RouteLogMeta } {
  const cleanedMeta = cleanLogMeta(meta);
  const summaryParts: string[] = [];
  const remainingMeta: RouteLogMeta = { ...cleanedMeta };

  if (typeof remainingMeta.status === "number") {
    summaryParts.push(`status=${remainingMeta.status}`);
    delete remainingMeta.status;
  }

  if (typeof remainingMeta.elapsedMs === "number") {
    summaryParts.push(`elapsed=${remainingMeta.elapsedMs}ms`);
    delete remainingMeta.elapsedMs;
  }

  return {
    summary: summaryParts.join(" "),
    meta: remainingMeta,
  };
}

function shouldLogRoute(routeId: string): boolean {
  if (ALWAYS_ENABLED_ROUTE_PATTERNS.some((pattern) => pattern.test(routeId))) {
    return true;
  }

  return ENABLE_ADMIN_API_ROUTE_LOGS;
}

export function writeStructuredLog({
  prefix,
  event,
  summary,
  meta = {},
  level = "log",
  enabled = true,
}: WriteStructuredLogOptions): void {
  if (!enabled) {
    return;
  }

  const metaString = formatLogMeta(meta);
  const line = [prefix, event, summary].filter(Boolean).join(" ");
  const output = metaString ? `${line} ${metaString}` : line;
  console[level](output);
}

function withElapsed(startedAt: number, meta: RouteLogMeta = {}): RouteLogMeta {
  return {
    elapsedMs: Date.now() - startedAt,
    ...meta,
  };
}

export function createApiRouteLogger(
  routeId: string,
  options: CreateApiRouteLoggerOptions = {}
) {
  const startedAt = Date.now();
  const traceId = `${startedAt.toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const prefix = `[api][${routeId}][${traceId}]`;
  const enabled = shouldLogRoute(routeId);

  const requestSummary = options.request
    ? createRequestSummary(options.request)
    : `${options.method ?? "unknown"} request`;
  const requestMeta = options.request
    ? createRequestMeta(options.request)
    : cleanLogMeta({
        request: {
          method: options.method ?? "unknown",
        },
      });

  return {
    enabled,
    traceId,
    startedAt,
    elapsedMs(): number {
      return Date.now() - startedAt;
    },
    start(meta: RouteLogMeta = {}): void {
      writeStructuredLog({
        prefix,
        event: "start",
        summary: requestSummary,
        meta: {
          ...requestMeta,
          ...meta,
        },
        enabled,
      });
    },
    info(event: string, meta: RouteLogMeta = {}): void {
      const outcome = splitOutcomeMeta(withElapsed(startedAt, meta));
      writeStructuredLog({
        prefix,
        event,
        summary: outcome.summary,
        meta: outcome.meta,
        enabled,
      });
    },
    warn(event: string, meta: RouteLogMeta = {}): void {
      const outcome = splitOutcomeMeta(withElapsed(startedAt, meta));
      writeStructuredLog({
        prefix,
        event,
        summary: outcome.summary,
        meta: outcome.meta,
        level: "warn",
        enabled,
      });
    },
    success(meta: RouteLogMeta = {}): void {
      const outcome = splitOutcomeMeta(withElapsed(startedAt, meta));
      writeStructuredLog({
        prefix,
        event: "success",
        summary: outcome.summary,
        meta: outcome.meta,
        enabled,
      });
    },
    error(event: string, error: unknown, meta: RouteLogMeta = {}): void {
      const outcome = splitOutcomeMeta(withElapsed(startedAt, {
        ...meta,
        error: serializeError(error),
      }));
      writeStructuredLog({
        prefix,
        event,
        summary: outcome.summary,
        meta: outcome.meta,
        level: "error",
        enabled,
      });
    },
  };
}
