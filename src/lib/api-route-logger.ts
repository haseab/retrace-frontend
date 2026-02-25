import { NextRequest } from "next/server";

type RouteLogMeta = Record<string, unknown>;

interface CreateApiRouteLoggerOptions {
  request?: NextRequest;
  method?: string;
}

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

  const requestMeta: RouteLogMeta = options.request
    ? {
        method: options.request.method,
        path: new URL(options.request.url).pathname,
        query: getQueryObject(options.request),
        contentType: options.request.headers.get("content-type") ?? undefined,
        contentLength: options.request.headers.get("content-length") ?? undefined,
        userAgent: options.request.headers.get("user-agent") ?? undefined,
        origin: options.request.headers.get("origin") ?? undefined,
        referer: options.request.headers.get("referer") ?? undefined,
        ip: extractClientIp(options.request) ?? undefined,
      }
    : {
        method: options.method ?? "unknown",
      };

  return {
    traceId,
    startedAt,
    elapsedMs(): number {
      return Date.now() - startedAt;
    },
    start(meta: RouteLogMeta = {}): void {
      console.log(`${prefix} start`, {
        ...requestMeta,
        ...meta,
      });
    },
    info(event: string, meta: RouteLogMeta = {}): void {
      console.log(`${prefix} ${event}`, withElapsed(startedAt, meta));
    },
    warn(event: string, meta: RouteLogMeta = {}): void {
      console.warn(`${prefix} ${event}`, withElapsed(startedAt, meta));
    },
    success(meta: RouteLogMeta = {}): void {
      console.log(`${prefix} success`, withElapsed(startedAt, meta));
    },
    error(event: string, error: unknown, meta: RouteLogMeta = {}): void {
      console.error(`${prefix} ${event}`, withElapsed(startedAt, {
        ...meta,
        error: serializeError(error),
      }));
    },
  };
}
