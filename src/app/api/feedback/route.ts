import { NextRequest, NextResponse } from "next/server";
import { gunzipSync } from "node:zlib";
import { db } from "@/lib/db";
import { requireApiBearerAuth } from "@/lib/api-auth";
import { createApiRouteLogger } from "@/lib/api-route-logger";
import {
  buildFeedbackRawDiagnosticsStatement,
  mapFeedbackSummaryRowToApiItem,
} from "@/lib/feedback-diagnostics";
import type {
  FeedbackAccessibilityInfo,
  FeedbackDisplayInfo,
  FeedbackPerformanceInfo,
  FeedbackProcessInfo,
} from "@/lib/feedback-diagnostics";
import type { DiagnosticMetricEvent } from "@/lib/types/feedback";

// Feedback submission structure matching FeedbackModels.swift
interface FeedbackSubmission {
  type: string; // "Bug Report" | "Feature Request" | "Question"
  email?: string;
  description: string;
  externalSource?: string; // "app" | "manual" | "github" | "featurebase"
  externalId?: string;
  externalUrl?: string;
  diagnostics: {
    appVersion?: string;
    buildNumber?: string;
    macOSVersion?: string;
    deviceModel?: string;
    totalDiskSpace?: string;
    freeDiskSpace?: string;
    databaseStats?: {
      sessionCount?: number;
      frameCount?: number;
      segmentCount?: number;
      databaseSizeMB?: number;
    };
    settingsSnapshot?: Record<string, unknown>;
    recentErrors?: string[];
    recentLogs?: string[];
    timestamp?: string;
    displayInfo?: FeedbackDisplayInfo;
    processInfo?: FeedbackProcessInfo;
    accessibilityInfo?: FeedbackAccessibilityInfo;
    performanceInfo?: FeedbackPerformanceInfo;
    recentMetricEvents?: DiagnosticMetricEvent[];
    emergencyCrashReports?: string[];
    includedSections?: string[];
    excludedSections?: string[];
  };
  includeScreenshot: boolean;
  screenshotData?: string; // Base64 encoded PNG
}

const DEFAULT_FEEDBACK_PAGE_SIZE = 30;
const MAX_FEEDBACK_PAGE_SIZE = 50;
const MAX_FEEDBACK_BODY_BYTES = getPositiveIntegerFromEnv("MAX_FEEDBACK_BODY_BYTES", 6 * 1024 * 1024);
const MAX_FEEDBACK_DESCRIPTION_CHARS = getPositiveIntegerFromEnv("MAX_FEEDBACK_DESCRIPTION_CHARS", 12_000);
const MAX_FEEDBACK_EMAIL_CHARS = getPositiveIntegerFromEnv("MAX_FEEDBACK_EMAIL_CHARS", 512);
const MAX_FEEDBACK_EXTERNAL_ID_CHARS = getPositiveIntegerFromEnv("MAX_FEEDBACK_EXTERNAL_ID_CHARS", 256);
const MAX_FEEDBACK_EXTERNAL_URL_CHARS = getPositiveIntegerFromEnv("MAX_FEEDBACK_EXTERNAL_URL_CHARS", 1_024);
const MAX_FEEDBACK_DIAGNOSTICS_TEXT_CHARS = getPositiveIntegerFromEnv("MAX_FEEDBACK_DIAGNOSTICS_TEXT_CHARS", 256);
const MAX_FEEDBACK_SETTINGS_SNAPSHOT_BYTES = getPositiveIntegerFromEnv("MAX_FEEDBACK_SETTINGS_SNAPSHOT_BYTES", 128 * 1024);
const MAX_FEEDBACK_RECENT_ERRORS = getPositiveIntegerFromEnv("MAX_FEEDBACK_RECENT_ERRORS", 300);
const MAX_FEEDBACK_RECENT_ERROR_CHARS = getPositiveIntegerFromEnv("MAX_FEEDBACK_RECENT_ERROR_CHARS", 1_500);
const MAX_FEEDBACK_RECENT_LOGS = getPositiveIntegerFromEnv("MAX_FEEDBACK_RECENT_LOGS", 10_000);
const MAX_FEEDBACK_RECENT_LOG_CHARS = getPositiveIntegerFromEnv("MAX_FEEDBACK_RECENT_LOG_CHARS", 2_000);
const MAX_FEEDBACK_RECENT_METRIC_EVENTS = getPositiveIntegerFromEnv("MAX_FEEDBACK_RECENT_METRIC_EVENTS", 200);
const MAX_FEEDBACK_RECENT_METRIC_EVENT_DETAIL_KEYS = 12;
const MAX_FEEDBACK_CRASH_REPORTS = getPositiveIntegerFromEnv("MAX_FEEDBACK_CRASH_REPORTS", 20);
const MAX_FEEDBACK_CRASH_REPORT_CHARS = getPositiveIntegerFromEnv("MAX_FEEDBACK_CRASH_REPORT_CHARS", 50_000);
const MAX_FEEDBACK_DIAGNOSTIC_SECTION_IDS = getPositiveIntegerFromEnv("MAX_FEEDBACK_DIAGNOSTIC_SECTION_IDS", 64);
const MAX_FEEDBACK_DIAGNOSTIC_SECTION_ID_CHARS = getPositiveIntegerFromEnv("MAX_FEEDBACK_DIAGNOSTIC_SECTION_ID_CHARS", 96);
const MAX_FEEDBACK_SCREENSHOT_BYTES = getPositiveIntegerFromEnv("MAX_FEEDBACK_SCREENSHOT_BYTES", 5 * 1024 * 1024);
const FEEDBACK_RATE_LIMIT_WINDOW_MS = getPositiveIntegerFromEnv("FEEDBACK_RATE_LIMIT_WINDOW_MS", 60_000);
const FEEDBACK_RATE_LIMIT_MAX_REQUESTS = getPositiveIntegerFromEnv("FEEDBACK_RATE_LIMIT_MAX_REQUESTS", 30);
const FEEDBACK_RATE_LIMIT_STORE_MAX_KEYS = getPositiveIntegerFromEnv("FEEDBACK_RATE_LIMIT_STORE_MAX_KEYS", 10_000);
const MAX_RATE_LIMIT_KEY_CHARS = 512;
const BASE64_PATTERN = /^[A-Za-z0-9+/]*={0,2}$/;

interface FeedbackRateLimitBucket {
  count: number;
  resetAt: number;
  lastSeenAt: number;
}

interface FeedbackRateLimitResult {
  limited: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
  key: string;
}

interface FeedbackBodyReadSuccess {
  ok: true;
  body: unknown;
  bytesRead: number;
  decodedBytes: number;
  contentEncoding: string;
  bodyReadMs: number;
  decompressMs: number;
  jsonParseMs: number;
  totalMs: number;
}

interface FeedbackBodyReadFailure {
  ok: false;
  status: 400 | 413;
  error: string;
  stage?: "content_length" | "body_missing" | "body_read" | "decompress" | "json_parse";
  bytesRead?: number;
  decodedBytes?: number;
  contentEncoding?: string;
  bodyReadMs?: number;
  decompressMs?: number;
  jsonParseMs?: number;
  totalMs?: number;
}

type FeedbackBodyReadResult = FeedbackBodyReadSuccess | FeedbackBodyReadFailure;

function decodeFeedbackRequestBody(
  bytes: Uint8Array,
  contentEncodingHeader: string | null
): Uint8Array {
  const encodings = (contentEncodingHeader ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value.length > 0 && value !== "identity");

  if (encodings.length === 0) {
    return bytes;
  }

  if (encodings.length === 1 && encodings[0] === "gzip") {
    return gunzipSync(Buffer.from(bytes));
  }

  throw new Error(`Unsupported Content-Encoding: ${contentEncodingHeader}`);
}

interface FeedbackPayloadValidationSuccess {
  ok: true;
  body: FeedbackSubmission;
  screenshotBuffer: Buffer | null;
}

interface FeedbackPayloadValidationFailure {
  ok: false;
  status: 400 | 413;
  error: string;
}

type FeedbackPayloadValidationResult =
  | FeedbackPayloadValidationSuccess
  | FeedbackPayloadValidationFailure;

interface FeedbackRateLimitGlobal {
  __feedbackIngestRateLimitStore?: Map<string, FeedbackRateLimitBucket>;
  __feedbackIngestRateLimitLastCleanupAt?: number;
}

function getPositiveIntegerFromEnv(key: string, fallback: number): number {
  const raw = process.env[key];
  if (!raw) {
    return fallback;
  }

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.trunc(parsed);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getStringLengthOrZero(value: unknown): number {
  return typeof value === "string" ? value.length : 0;
}

function normalizeOptionalBoundedString(
  value: unknown,
  fieldName: string,
  maxChars: number
): { ok: true; value: string | undefined } | { ok: false; status: 400 | 413; error: string } {
  if (value === undefined) {
    return { ok: true, value: undefined };
  }

  if (typeof value !== "string") {
    return {
      ok: false,
      status: 400,
      error: `Invalid ${fieldName}; expected string.`,
    };
  }

  if (value.length > maxChars) {
    return {
      ok: false,
      status: 413,
      error: `${fieldName} exceeds max length of ${maxChars} characters.`,
    };
  }

  return { ok: true, value };
}

function normalizeRequiredBoundedString(
  value: unknown,
  fieldName: string,
  maxChars: number
): { ok: true; value: string } | { ok: false; status: 400 | 413; error: string } {
  const normalized = String(value ?? "").trim();
  if (normalized.length === 0) {
    return {
      ok: false,
      status: 400,
      error: `Invalid ${fieldName}; expected non-empty string.`,
    };
  }

  if (normalized.length > maxChars) {
    return {
      ok: false,
      status: 413,
      error: `${fieldName} exceeds max length of ${maxChars} characters.`,
    };
  }

  return { ok: true, value: normalized };
}

function parseOptionalNumber(value: unknown): number | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value === "string" && value.trim().length === 0) {
    return undefined;
  }

  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeStringArray(
  value: unknown,
  fieldName: string,
  maxItems: number,
  maxChars: number,
  options: {
    optional?: boolean;
    trimEntries?: boolean;
    dedupe?: boolean;
    skipEmpty?: boolean;
  } = {}
): { ok: true; value: string[] | undefined } | { ok: false; status: 400 | 413; error: string } {
  if (value === undefined && options.optional) {
    return { ok: true, value: undefined };
  }

  if (!Array.isArray(value)) {
    return {
      ok: false,
      status: 400,
      error: `Invalid ${fieldName}; expected array of strings.`,
    };
  }

  if (value.length > maxItems) {
    return {
      ok: false,
      status: 413,
      error: `${fieldName} exceeds max item count of ${maxItems}.`,
    };
  }

  const normalized: string[] = [];
  const seen = options.dedupe ? new Set<string>() : null;
  for (let index = 0; index < value.length; index += 1) {
    const entry = value[index];
    if (typeof entry !== "string") {
      return {
        ok: false,
        status: 400,
        error: `Invalid ${fieldName}[${index}]; expected string.`,
      };
    }

    const normalizedEntry = options.trimEntries ? entry.trim() : entry;
    if (options.skipEmpty && normalizedEntry.length === 0) {
      continue;
    }

    if (normalizedEntry.length > maxChars) {
      return {
        ok: false,
        status: 413,
        error: `${fieldName}[${index}] exceeds max length of ${maxChars} characters.`,
      };
    }

    if (seen) {
      if (seen.has(normalizedEntry)) {
        continue;
      }
      seen.add(normalizedEntry);
    }

    normalized.push(normalizedEntry);
  }

  return { ok: true, value: normalized };
}

function serializeOptionalJson(value: unknown): string | null {
  if (value === undefined) {
    return null;
  }

  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
}

function normalizeStringRecord(
  value: unknown,
  fieldName: string,
  maxEntries: number,
  maxChars: number
): { ok: true; value: Record<string, string> } | { ok: false; status: 400 | 413; error: string } {
  if (!isRecord(value)) {
    return {
      ok: false,
      status: 400,
      error: `Invalid ${fieldName}; expected key-value object.`,
    };
  }

  const entries = Object.entries(value);
  if (entries.length > maxEntries) {
    return {
      ok: false,
      status: 413,
      error: `${fieldName} exceeds max key count of ${maxEntries}.`,
    };
  }

  const normalized: Record<string, string> = {};
  for (const [rawKey, rawValue] of entries) {
    const key = rawKey.trim();
    const entryValue = String(rawValue ?? "").trim();
    if (key.length === 0 || entryValue.length === 0) {
      continue;
    }

    if (key.length > maxChars) {
      return {
        ok: false,
        status: 413,
        error: `${fieldName} key exceeds max length of ${maxChars} characters.`,
      };
    }

    if (entryValue.length > maxChars) {
      return {
        ok: false,
        status: 413,
        error: `${fieldName}.${key} exceeds max length of ${maxChars} characters.`,
      };
    }

    normalized[key] = entryValue;
  }

  return { ok: true, value: normalized };
}

function normalizeRecentMetricEvents(
  value: unknown,
  fieldName: string
):
  | {
      ok: true;
      value: DiagnosticMetricEvent[];
    }
  | { ok: false; status: 400 | 413; error: string } {
  if (!Array.isArray(value)) {
    return {
      ok: false,
      status: 400,
      error: `Invalid ${fieldName}; expected array of objects.`,
    };
  }

  if (value.length > MAX_FEEDBACK_RECENT_METRIC_EVENTS) {
    return {
      ok: false,
      status: 413,
      error: `${fieldName} exceeds max item count of ${MAX_FEEDBACK_RECENT_METRIC_EVENTS}.`,
    };
  }

  const normalized: DiagnosticMetricEvent[] = [];

  for (let index = 0; index < value.length; index += 1) {
    const entry = value[index];
    if (!isRecord(entry)) {
      return {
        ok: false,
        status: 400,
        error: `Invalid ${fieldName}[${index}]; expected object.`,
      };
    }

    const timestampResult = normalizeRequiredBoundedString(
      entry.timestamp,
      `${fieldName}[${index}].timestamp`,
      MAX_FEEDBACK_DIAGNOSTICS_TEXT_CHARS
    );
    if (!timestampResult.ok) {
      return timestampResult;
    }

    const metricTypeResult = normalizeRequiredBoundedString(
      entry.metricType,
      `${fieldName}[${index}].metricType`,
      MAX_FEEDBACK_DIAGNOSTICS_TEXT_CHARS
    );
    if (!metricTypeResult.ok) {
      return metricTypeResult;
    }

    const summaryResult = normalizeRequiredBoundedString(
      entry.summary,
      `${fieldName}[${index}].summary`,
      MAX_FEEDBACK_DIAGNOSTICS_TEXT_CHARS
    );
    if (!summaryResult.ok) {
      return summaryResult;
    }

    const detailsResult = normalizeStringRecord(
      entry.details ?? {},
      `${fieldName}[${index}].details`,
      MAX_FEEDBACK_RECENT_METRIC_EVENT_DETAIL_KEYS,
      MAX_FEEDBACK_DIAGNOSTICS_TEXT_CHARS
    );
    if (!detailsResult.ok) {
      return detailsResult;
    }

    normalized.push({
      timestamp: timestampResult.value,
      metricType: metricTypeResult.value,
      summary: summaryResult.value,
      details: detailsResult.value,
    });
  }

  return { ok: true, value: normalized };
}

function estimateBase64DecodedBytes(base64: string): number | null {
  if (base64.length === 0) {
    return 0;
  }

  if (base64.length % 4 !== 0 || !BASE64_PATTERN.test(base64)) {
    return null;
  }

  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return (base64.length / 4) * 3 - padding;
}

function getFeedbackRateLimitStore(): Map<string, FeedbackRateLimitBucket> {
  const globalState = globalThis as typeof globalThis & FeedbackRateLimitGlobal;
  if (!globalState.__feedbackIngestRateLimitStore) {
    globalState.__feedbackIngestRateLimitStore = new Map<string, FeedbackRateLimitBucket>();
  }
  return globalState.__feedbackIngestRateLimitStore;
}

function cleanupFeedbackRateLimitStore(now: number): void {
  const globalState = globalThis as typeof globalThis & FeedbackRateLimitGlobal;
  const lastCleanupAt = globalState.__feedbackIngestRateLimitLastCleanupAt ?? 0;
  if (now - lastCleanupAt < FEEDBACK_RATE_LIMIT_WINDOW_MS) {
    return;
  }
  globalState.__feedbackIngestRateLimitLastCleanupAt = now;

  const store = getFeedbackRateLimitStore();
  for (const [key, bucket] of store) {
    if (bucket.resetAt <= now) {
      store.delete(key);
    }
  }

  if (store.size <= FEEDBACK_RATE_LIMIT_STORE_MAX_KEYS) {
    return;
  }

  const keysToDelete = store.size - FEEDBACK_RATE_LIMIT_STORE_MAX_KEYS;
  const iterator = store.keys();
  for (let index = 0; index < keysToDelete; index += 1) {
    const entry = iterator.next();
    if (entry.done) {
      break;
    }
    store.delete(entry.value);
  }
}

function getClientAddress(request: NextRequest): string {
  const cfConnectingIp = request.headers.get("cf-connecting-ip")?.trim();
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) {
    return realIp;
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) {
      return first;
    }
  }

  return "unknown";
}

function getFeedbackRateLimitKey(request: NextRequest): string {
  const ip = getClientAddress(request);
  if (ip !== "unknown") {
    return `ip:${ip.slice(0, MAX_RATE_LIMIT_KEY_CHARS)}`;
  }

  const userAgent = request.headers.get("user-agent")?.trim() || "unknown";
  return `ua:${userAgent.slice(0, MAX_RATE_LIMIT_KEY_CHARS)}`;
}

function checkFeedbackIngestRateLimit(request: NextRequest): FeedbackRateLimitResult {
  const now = Date.now();
  cleanupFeedbackRateLimitStore(now);

  const key = getFeedbackRateLimitKey(request);
  const store = getFeedbackRateLimitStore();
  const existing = store.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + FEEDBACK_RATE_LIMIT_WINDOW_MS;
    store.set(key, {
      count: 1,
      resetAt,
      lastSeenAt: now,
    });

    return {
      limited: false,
      limit: FEEDBACK_RATE_LIMIT_MAX_REQUESTS,
      remaining: Math.max(0, FEEDBACK_RATE_LIMIT_MAX_REQUESTS - 1),
      retryAfterSeconds: Math.max(1, Math.ceil((resetAt - now) / 1000)),
      key,
    };
  }

  existing.count += 1;
  existing.lastSeenAt = now;
  store.delete(key);
  store.set(key, existing);

  const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
  if (existing.count > FEEDBACK_RATE_LIMIT_MAX_REQUESTS) {
    return {
      limited: true,
      limit: FEEDBACK_RATE_LIMIT_MAX_REQUESTS,
      remaining: 0,
      retryAfterSeconds,
      key,
    };
  }

  return {
    limited: false,
    limit: FEEDBACK_RATE_LIMIT_MAX_REQUESTS,
    remaining: Math.max(0, FEEDBACK_RATE_LIMIT_MAX_REQUESTS - existing.count),
    retryAfterSeconds,
    key,
  };
}

function createRateLimitedResponse(rateLimit: FeedbackRateLimitResult): NextResponse {
  const response = NextResponse.json(
    {
      error: "Too many feedback submissions. Please retry shortly.",
    },
    { status: 429 }
  );
  response.headers.set("Retry-After", String(rateLimit.retryAfterSeconds));
  response.headers.set("X-RateLimit-Limit", String(rateLimit.limit));
  response.headers.set("X-RateLimit-Remaining", "0");
  return response;
}

async function readRequestJsonWithLimit(
  request: NextRequest,
  maxBytes: number
): Promise<FeedbackBodyReadResult> {
  const startedAt = Date.now();
  const contentEncoding = request.headers.get("content-encoding")?.trim() || "identity";
  const contentLengthHeader = request.headers.get("content-length");
  if (contentLengthHeader) {
    const parsedContentLength = Number(contentLengthHeader);
    if (Number.isFinite(parsedContentLength) && parsedContentLength > maxBytes) {
      return {
        ok: false,
        status: 413,
        error: `Payload too large. Max body size is ${maxBytes} bytes.`,
        stage: "content_length",
        contentEncoding,
        totalMs: elapsedMs(startedAt),
      };
    }
  }

  if (!request.body) {
    return {
      ok: false,
      status: 400,
      error: "Request body is required.",
      stage: "body_missing",
      contentEncoding,
      totalMs: elapsedMs(startedAt),
    };
  }

  const bodyReadStartedAt = Date.now();
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytesRead = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    if (!value) {
      continue;
    }

    bytesRead += value.byteLength;
    if (bytesRead > maxBytes) {
      await reader.cancel();
      return {
        ok: false,
        status: 413,
        error: `Payload too large. Max body size is ${maxBytes} bytes.`,
        stage: "body_read",
        bytesRead,
        contentEncoding,
        bodyReadMs: elapsedMs(bodyReadStartedAt),
        totalMs: elapsedMs(startedAt),
      };
    }

    chunks.push(value);
  }

  if (bytesRead === 0) {
    return {
      ok: false,
      status: 400,
      error: "Request body is required.",
      stage: "body_read",
      bytesRead,
      contentEncoding,
      bodyReadMs: elapsedMs(bodyReadStartedAt),
      totalMs: elapsedMs(startedAt),
    };
  }

  const combined = new Uint8Array(bytesRead);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.byteLength;
  }
  const bodyReadMs = elapsedMs(bodyReadStartedAt);

  let decodedBody: Uint8Array;
  const decodeStartedAt = Date.now();
  try {
    decodedBody = decodeFeedbackRequestBody(
      combined,
      request.headers.get("content-encoding")
    );
  } catch {
    return {
      ok: false,
      status: 400,
      error: "Invalid compressed request body.",
      stage: "decompress",
      bytesRead,
      contentEncoding,
      bodyReadMs,
      decompressMs: elapsedMs(decodeStartedAt),
      totalMs: elapsedMs(startedAt),
    };
  }
  const decompressMs = elapsedMs(decodeStartedAt);

  let parsedBody: unknown;
  const parseStartedAt = Date.now();
  try {
    parsedBody = JSON.parse(new TextDecoder().decode(decodedBody));
  } catch {
    return {
      ok: false,
      status: 400,
      error: "Invalid JSON payload.",
      stage: "json_parse",
      bytesRead,
      decodedBytes: decodedBody.byteLength,
      contentEncoding,
      bodyReadMs,
      decompressMs,
      jsonParseMs: elapsedMs(parseStartedAt),
      totalMs: elapsedMs(startedAt),
    };
  }
  const jsonParseMs = elapsedMs(parseStartedAt);

  return {
    ok: true,
    body: parsedBody,
    bytesRead,
    decodedBytes: decodedBody.byteLength,
    contentEncoding,
    bodyReadMs,
    decompressMs,
    jsonParseMs,
    totalMs: elapsedMs(startedAt),
  };
}

function validateFeedbackPayload(rawBody: unknown): FeedbackPayloadValidationResult {
  if (!isRecord(rawBody)) {
    return {
      ok: false,
      status: 400,
      error: "Invalid feedback payload.",
    };
  }

  const body = rawBody as Partial<FeedbackSubmission>;
  if (typeof body.type !== "string" || body.type.length === 0) {
    return {
      ok: false,
      status: 400,
      error: "Missing required field: type.",
    };
  }

  if (typeof body.description !== "string") {
    return {
      ok: false,
      status: 400,
      error: "Missing required field: description.",
    };
  }

  if (body.description.length > MAX_FEEDBACK_DESCRIPTION_CHARS) {
    return {
      ok: false,
      status: 413,
      error: `description exceeds max length of ${MAX_FEEDBACK_DESCRIPTION_CHARS} characters.`,
    };
  }

  if (body.description.trim().length === 0) {
    return {
      ok: false,
      status: 400,
      error: "Description cannot be empty.",
    };
  }

  if (body.email !== undefined) {
    if (typeof body.email !== "string") {
      return {
        ok: false,
        status: 400,
        error: "Invalid email field.",
      };
    }

    if (body.email.length > MAX_FEEDBACK_EMAIL_CHARS) {
      return {
        ok: false,
        status: 413,
        error: `email exceeds max length of ${MAX_FEEDBACK_EMAIL_CHARS} characters.`,
      };
    }
  }

  if (body.externalId !== undefined) {
    if (typeof body.externalId !== "string") {
      return {
        ok: false,
        status: 400,
        error: "Invalid externalId field.",
      };
    }
    if (body.externalId.length > MAX_FEEDBACK_EXTERNAL_ID_CHARS) {
      return {
        ok: false,
        status: 413,
        error: `externalId exceeds max length of ${MAX_FEEDBACK_EXTERNAL_ID_CHARS} characters.`,
      };
    }
  }

  if (body.externalUrl !== undefined) {
    if (typeof body.externalUrl !== "string") {
      return {
        ok: false,
        status: 400,
        error: "Invalid externalUrl field.",
      };
    }
    if (body.externalUrl.length > MAX_FEEDBACK_EXTERNAL_URL_CHARS) {
      return {
        ok: false,
        status: 413,
        error: `externalUrl exceeds max length of ${MAX_FEEDBACK_EXTERNAL_URL_CHARS} characters.`,
      };
    }
  }

  if (typeof body.includeScreenshot !== "boolean") {
    return {
      ok: false,
      status: 400,
      error: "Missing required field: includeScreenshot.",
    };
  }

  if (!isRecord(body.diagnostics)) {
    return {
      ok: false,
      status: 400,
      error: "Missing required field: diagnostics.",
    };
  }

  const diagnostics = body.diagnostics as Record<string, unknown>;
  const appVersionResult = normalizeOptionalBoundedString(
    diagnostics.appVersion,
    "diagnostics.appVersion",
    MAX_FEEDBACK_DIAGNOSTICS_TEXT_CHARS
  );
  if (!appVersionResult.ok) {
    return appVersionResult;
  }
  const buildNumberResult = normalizeOptionalBoundedString(
    diagnostics.buildNumber,
    "diagnostics.buildNumber",
    MAX_FEEDBACK_DIAGNOSTICS_TEXT_CHARS
  );
  if (!buildNumberResult.ok) {
    return buildNumberResult;
  }
  const macOsResult = normalizeOptionalBoundedString(
    diagnostics.macOSVersion,
    "diagnostics.macOSVersion",
    MAX_FEEDBACK_DIAGNOSTICS_TEXT_CHARS
  );
  if (!macOsResult.ok) {
    return macOsResult;
  }
  const deviceModelResult = normalizeOptionalBoundedString(
    diagnostics.deviceModel,
    "diagnostics.deviceModel",
    MAX_FEEDBACK_DIAGNOSTICS_TEXT_CHARS
  );
  if (!deviceModelResult.ok) {
    return deviceModelResult;
  }
  const totalDiskSpaceResult = normalizeOptionalBoundedString(
    diagnostics.totalDiskSpace,
    "diagnostics.totalDiskSpace",
    MAX_FEEDBACK_DIAGNOSTICS_TEXT_CHARS
  );
  if (!totalDiskSpaceResult.ok) {
    return totalDiskSpaceResult;
  }
  const freeDiskSpaceResult = normalizeOptionalBoundedString(
    diagnostics.freeDiskSpace,
    "diagnostics.freeDiskSpace",
    MAX_FEEDBACK_DIAGNOSTICS_TEXT_CHARS
  );
  if (!freeDiskSpaceResult.ok) {
    return freeDiskSpaceResult;
  }

  if (diagnostics.databaseStats !== undefined && !isRecord(diagnostics.databaseStats)) {
    return {
      ok: false,
      status: 400,
      error: "Invalid diagnostics.databaseStats; expected object.",
    };
  }
  const databaseStats = isRecord(diagnostics.databaseStats)
    ? diagnostics.databaseStats as Record<string, unknown>
    : undefined;

  const recentErrorsResult = normalizeStringArray(
    diagnostics.recentErrors,
    "diagnostics.recentErrors",
    MAX_FEEDBACK_RECENT_ERRORS,
    MAX_FEEDBACK_RECENT_ERROR_CHARS,
    { optional: true }
  );
  if (!recentErrorsResult.ok) {
    return recentErrorsResult;
  }

  const recentLogsResult = normalizeStringArray(
    diagnostics.recentLogs,
    "diagnostics.recentLogs",
    MAX_FEEDBACK_RECENT_LOGS,
    MAX_FEEDBACK_RECENT_LOG_CHARS,
    { optional: true }
  );
  if (!recentLogsResult.ok) {
    return recentLogsResult;
  }

  const crashReportsResult = normalizeStringArray(
    diagnostics.emergencyCrashReports,
    "diagnostics.emergencyCrashReports",
    MAX_FEEDBACK_CRASH_REPORTS,
    MAX_FEEDBACK_CRASH_REPORT_CHARS,
    { optional: true }
  );
  if (!crashReportsResult.ok) {
    return crashReportsResult;
  }

  const recentMetricEventsResult = diagnostics.recentMetricEvents === undefined
    ? {
        ok: true as const,
        value: undefined,
      }
    : normalizeRecentMetricEvents(
        diagnostics.recentMetricEvents,
        "diagnostics.recentMetricEvents"
      );
  if (!recentMetricEventsResult.ok) {
    return recentMetricEventsResult;
  }

  const includedSectionsResult = normalizeStringArray(
    diagnostics.includedSections,
    "diagnostics.includedSections",
    MAX_FEEDBACK_DIAGNOSTIC_SECTION_IDS,
    MAX_FEEDBACK_DIAGNOSTIC_SECTION_ID_CHARS,
    {
      optional: true,
      trimEntries: true,
      dedupe: true,
      skipEmpty: true,
    }
  );
  if (!includedSectionsResult.ok) {
    return includedSectionsResult;
  }

  const excludedSectionsResult = normalizeStringArray(
    diagnostics.excludedSections,
    "diagnostics.excludedSections",
    MAX_FEEDBACK_DIAGNOSTIC_SECTION_IDS,
    MAX_FEEDBACK_DIAGNOSTIC_SECTION_ID_CHARS,
    {
      optional: true,
      trimEntries: true,
      dedupe: true,
      skipEmpty: true,
    }
  );
  if (!excludedSectionsResult.ok) {
    return excludedSectionsResult;
  }

  const settingsSnapshot = diagnostics.settingsSnapshot;
  if (settingsSnapshot !== undefined && !isRecord(settingsSnapshot)) {
    return {
      ok: false,
      status: 400,
      error: "Invalid diagnostics.settingsSnapshot; expected object.",
    };
  }

  if (settingsSnapshot !== undefined) {
    const settingsBytes = getStringLengthOrZero(JSON.stringify(settingsSnapshot));
    if (settingsBytes > MAX_FEEDBACK_SETTINGS_SNAPSHOT_BYTES) {
      return {
        ok: false,
        status: 413,
        error: `diagnostics.settingsSnapshot exceeds ${MAX_FEEDBACK_SETTINGS_SNAPSHOT_BYTES} bytes.`,
      };
    }
  }

  let screenshotBuffer: Buffer | null = null;
  if (body.screenshotData !== undefined) {
    if (typeof body.screenshotData !== "string") {
      return {
        ok: false,
        status: 400,
        error: "Invalid screenshotData; expected base64 string.",
      };
    }

    const normalizedScreenshot = body.screenshotData.replace(/\s+/g, "");
    const decodedSize = estimateBase64DecodedBytes(normalizedScreenshot);
    if (decodedSize === null) {
      return {
        ok: false,
        status: 400,
        error: "Invalid screenshotData base64 payload.",
      };
    }

    if (decodedSize > MAX_FEEDBACK_SCREENSHOT_BYTES) {
      return {
        ok: false,
        status: 413,
        error: `screenshotData exceeds max size of ${MAX_FEEDBACK_SCREENSHOT_BYTES} bytes.`,
      };
    }

    screenshotBuffer = decodedSize > 0
      ? Buffer.from(normalizedScreenshot, "base64")
      : null;

    if (screenshotBuffer && screenshotBuffer.length !== decodedSize) {
      return {
        ok: false,
        status: 400,
        error: "Invalid screenshotData base64 payload.",
      };
    }
  }

  if (body.includeScreenshot && !screenshotBuffer) {
    return {
      ok: false,
      status: 400,
      error: "includeScreenshot is true but screenshotData is missing or invalid.",
    };
  }

  const normalizedIncludedSections = includedSectionsResult.value;
  const normalizedExcludedSections = excludedSectionsResult.value === undefined
    ? undefined
    : excludedSectionsResult.value.filter((sectionId) => !normalizedIncludedSections?.includes(sectionId));

  const normalizedBody: FeedbackSubmission = {
    type: body.type,
    description: body.description,
    includeScreenshot: body.includeScreenshot,
    diagnostics: {
      appVersion: appVersionResult.value,
      buildNumber: buildNumberResult.value,
      macOSVersion: macOsResult.value,
      deviceModel: deviceModelResult.value,
      totalDiskSpace: totalDiskSpaceResult.value,
      freeDiskSpace: freeDiskSpaceResult.value,
      databaseStats: databaseStats
        ? {
            sessionCount: parseOptionalNumber(databaseStats.sessionCount),
            frameCount: parseOptionalNumber(databaseStats.frameCount),
            segmentCount: parseOptionalNumber(databaseStats.segmentCount),
            databaseSizeMB: parseOptionalNumber(databaseStats.databaseSizeMB),
          }
        : undefined,
      recentErrors: recentErrorsResult.value,
      recentLogs: recentLogsResult.value,
      emergencyCrashReports: crashReportsResult.value,
      timestamp: typeof diagnostics.timestamp === "string" ? diagnostics.timestamp : undefined,
      settingsSnapshot: isRecord(settingsSnapshot) ? settingsSnapshot : undefined,
      displayInfo: diagnostics.displayInfo as FeedbackDisplayInfo | undefined,
      processInfo: diagnostics.processInfo as FeedbackProcessInfo | undefined,
      accessibilityInfo: diagnostics.accessibilityInfo as FeedbackAccessibilityInfo | undefined,
      performanceInfo: diagnostics.performanceInfo as FeedbackPerformanceInfo | undefined,
      recentMetricEvents: recentMetricEventsResult.value,
      includedSections: normalizedIncludedSections,
      excludedSections: normalizedExcludedSections,
    },
    email: typeof body.email === "string" ? body.email : undefined,
    externalSource: typeof body.externalSource === "string" ? body.externalSource : undefined,
    externalId: typeof body.externalId === "string" ? body.externalId : undefined,
    externalUrl: typeof body.externalUrl === "string" ? body.externalUrl : undefined,
    screenshotData: typeof body.screenshotData === "string" ? body.screenshotData : undefined,
  };

  return {
    ok: true,
    body: normalizedBody,
    screenshotBuffer,
  };
}

function elapsedMs(startedAt: number): number {
  return Date.now() - startedAt;
}

function toFeedbackId(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return Math.trunc(parsed);
}

function getDisplayCount(displayInfo: FeedbackDisplayInfo | undefined): number {
  if (!displayInfo) {
    return 0;
  }

  const displayLength = Array.isArray(displayInfo.displays) ? displayInfo.displays.length : 0;
  const parsedCount = Number(displayInfo.count);
  if (!Number.isFinite(parsedCount)) {
    return displayLength;
  }

  return Math.max(0, Math.max(Math.trunc(parsedCount), displayLength));
}

function normalizeExternalSource(rawSource: unknown, appVersion: string, buildNumber: string): "app" | "manual" | "github" | "featurebase" {
  const source = String(rawSource ?? "").trim().toLowerCase();
  if (source === "app" || source === "manual" || source === "github" || source === "featurebase") {
    return source;
  }

  if (appVersion === "internal-dashboard" || buildNumber === "manual-entry") {
    return "manual";
  }

  return "app";
}

function normalizeOptionalText(value: unknown): string | null {
  const normalized = String(value ?? "").trim();
  return normalized.length > 0 ? normalized : null;
}

export async function POST(request: NextRequest) {
  const logger = createApiRouteLogger("feedback.POST", { request });
  const rateLimit = checkFeedbackIngestRateLimit(request);
  logger.start({ rateLimitRemaining: rateLimit.remaining });

  // App clients submit feedback directly and do not send the dashboard bearer token.
  // Keep POST ingest open; bearer auth is enforced on admin read/write APIs.
  if (rateLimit.limited) {
    logger.warn("rate_limited", {
      status: 429,
      retryAfterSeconds: rateLimit.retryAfterSeconds,
      key: rateLimit.key,
    });
    return createRateLimitedResponse(rateLimit);
  }

  try {
    const parsedBodyResult = await readRequestJsonWithLimit(request, MAX_FEEDBACK_BODY_BYTES);
    if (!parsedBodyResult.ok) {
      logger.warn("invalid_payload", {
        status: parsedBodyResult.status,
        reason: parsedBodyResult.error,
        stage: parsedBodyResult.stage,
        requestBytes: parsedBodyResult.bytesRead,
        decodedBytes: parsedBodyResult.decodedBytes,
        contentEncoding: parsedBodyResult.contentEncoding,
        bodyReadMs: parsedBodyResult.bodyReadMs,
        decompressMs: parsedBodyResult.decompressMs,
        jsonParseMs: parsedBodyResult.jsonParseMs,
        payloadReadMs: parsedBodyResult.totalMs,
      });
      return NextResponse.json(
        { error: parsedBodyResult.error },
        { status: parsedBodyResult.status }
      );
    }

    const validationStartedAt = Date.now();
    const validationResult = validateFeedbackPayload(parsedBodyResult.body);
    const validationMs = elapsedMs(validationStartedAt);
    if (!validationResult.ok) {
      logger.warn("invalid_payload", {
        status: validationResult.status,
        reason: validationResult.error,
        stage: "validation",
        requestBytes: parsedBodyResult.bytesRead,
        decodedBytes: parsedBodyResult.decodedBytes,
        contentEncoding: parsedBodyResult.contentEncoding,
        bodyReadMs: parsedBodyResult.bodyReadMs,
        decompressMs: parsedBodyResult.decompressMs,
        jsonParseMs: parsedBodyResult.jsonParseMs,
        validationMs,
        payloadReadyMs: parsedBodyResult.totalMs + validationMs,
      });
      return NextResponse.json(
        { error: validationResult.error },
        { status: validationResult.status }
      );
    }

    const body = validationResult.body;
    const screenshotBuffer = validationResult.screenshotBuffer;

    logger.info("payload_parsed", {
      requestBytes: parsedBodyResult.bytesRead,
      decodedBytes: parsedBodyResult.decodedBytes,
      contentEncoding: parsedBodyResult.contentEncoding,
      bodyReadMs: parsedBodyResult.bodyReadMs,
      decompressMs: parsedBodyResult.decompressMs,
      jsonParseMs: parsedBodyResult.jsonParseMs,
      validationMs,
      payloadReadyMs: parsedBodyResult.totalMs + validationMs,
      descriptionChars: body.description?.length ?? 0,
      screenshotBytes: screenshotBuffer?.byteLength ?? 0,
      diagnostics: {
        recentLogs: body.diagnostics?.recentLogs?.length ?? 0,
        recentErrors: body.diagnostics?.recentErrors?.length ?? 0,
        settings: body.diagnostics?.settingsSnapshot
          ? Object.keys(body.diagnostics.settingsSnapshot).length
          : 0,
        crashReports: body.diagnostics?.emergencyCrashReports?.length ?? 0,
        recentMetricEvents: body.diagnostics?.recentMetricEvents?.length ?? 0,
      },
    });

    // Validate feedback type
    const validTypes = ["Bug Report", "Feature Request", "Question"];
    if (!validTypes.includes(body.type)) {
      logger.warn("invalid_feedback_type", { status: 400, type: body.type });
      return NextResponse.json(
        { error: `Invalid feedback type. Must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    const diagnosticsTimestamp = body.diagnostics.timestamp || new Date().toISOString();
    const displayCount = getDisplayCount(body.diagnostics.displayInfo);
    const externalSource = normalizeExternalSource(
      body.externalSource,
      body.diagnostics.appVersion ?? "",
      body.diagnostics.buildNumber ?? ""
    );
    const externalId = normalizeOptionalText(body.externalId);
    const externalUrl = normalizeOptionalText(body.externalUrl);
    const hasScreenshot = Boolean(body.includeScreenshot && screenshotBuffer);

    const diagnosticsPayload = {
      settingsSnapshot: body.diagnostics.settingsSnapshot,
      recentErrors: body.diagnostics.recentErrors,
      recentLogs: body.diagnostics.recentLogs,
      displayInfo: body.diagnostics.displayInfo,
      processInfo: body.diagnostics.processInfo,
      accessibilityInfo: body.diagnostics.accessibilityInfo,
      performanceInfo: body.diagnostics.performanceInfo,
      emergencyCrashReports: body.diagnostics.emergencyCrashReports,
      recentMetricEvents: body.diagnostics.recentMetricEvents,
    };

    const transaction = await db.transaction("write");
    let feedbackId: number | null = null;
    let rawDiagnosticsDecodedBytes = 0;
    let rawDiagnosticsStoredBytes = 0;
    const insertFeedbackStartedAt = Date.now();
    let diagnosticsWriteStartedAt = 0;

    try {
      const result = await transaction.execute({
        sql: `
          INSERT INTO feedback (
            type, email, description, status, priority, notes, is_read,
            app_version, build_number, macos_version,
            device_model, total_disk_space, free_disk_space, session_count,
            frame_count, segment_count, database_size_mb,
            diagnostics_timestamp, display_count, has_screenshot,
            external_source, external_id, external_url,
            included_diagnostic_sections, excluded_diagnostic_sections,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `,
        args: [
          body.type,
          body.email || null,
          body.description,
          "open",
          "medium",
          "",
          0,
          body.diagnostics.appVersion ?? null,
          body.diagnostics.buildNumber ?? null,
          body.diagnostics.macOSVersion ?? null,
          body.diagnostics.deviceModel ?? null,
          body.diagnostics.totalDiskSpace ?? null,
          body.diagnostics.freeDiskSpace ?? null,
          body.diagnostics.databaseStats?.sessionCount ?? null,
          body.diagnostics.databaseStats?.frameCount ?? null,
          body.diagnostics.databaseStats?.segmentCount ?? null,
          body.diagnostics.databaseStats?.databaseSizeMB ?? null,
          diagnosticsTimestamp,
          displayCount,
          hasScreenshot ? 1 : 0,
          externalSource,
          externalId,
          externalUrl,
          serializeOptionalJson(body.diagnostics.includedSections),
          serializeOptionalJson(body.diagnostics.excludedSections),
        ],
      });

      feedbackId = toFeedbackId(result.lastInsertRowid);
      if (feedbackId === null) {
        throw new Error("Failed to determine inserted feedback id");
      }

      const secondaryStatements: Array<{
        sql: string;
        args: Array<string | number | Uint8Array | null>;
      }> = [];
      const rawDiagnosticsStatement = buildFeedbackRawDiagnosticsStatement(
        feedbackId,
        diagnosticsPayload
      );
      if (rawDiagnosticsStatement) {
        secondaryStatements.push(rawDiagnosticsStatement.statement);
        rawDiagnosticsDecodedBytes = rawDiagnosticsStatement.decodedBytes;
        rawDiagnosticsStoredBytes = rawDiagnosticsStatement.storedBytes;
      }

      if (hasScreenshot && screenshotBuffer) {
        secondaryStatements.push({
          sql: `
            INSERT INTO feedback_screenshots (
              feedback_id, content_type, screenshot_data
            ) VALUES (?, ?, ?)
            ON CONFLICT(feedback_id) DO UPDATE SET
              content_type = excluded.content_type,
              screenshot_data = excluded.screenshot_data,
              updated_at = datetime('now')
          `,
          args: [feedbackId, "image/png", screenshotBuffer],
        });
      }

      if (secondaryStatements.length > 0) {
        diagnosticsWriteStartedAt = Date.now();
        await transaction.batch(secondaryStatements);
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback().catch(() => undefined);
      throw error;
    } finally {
      transaction.close();
    }

    if (feedbackId === null) {
      throw new Error("Failed to determine inserted feedback id");
    }

    logger.info("feedback_inserted", {
      feedbackId,
      insertFeedbackMs: elapsedMs(insertFeedbackStartedAt),
      displayCount,
      hasScreenshot,
      externalSource,
      requestBytes: parsedBodyResult.bytesRead,
      decodedBytes: parsedBodyResult.decodedBytes,
    });

    logger.info("diagnostics_persisted", {
      feedbackId,
      diagnosticsWriteMs: diagnosticsWriteStartedAt === 0 ? 0 : elapsedMs(diagnosticsWriteStartedAt),
      mode: "raw",
      rawDiagnosticsDecodedBytes,
      rawDiagnosticsStoredBytes,
      recentLogs: body.diagnostics.recentLogs?.length ?? 0,
      recentErrors: body.diagnostics.recentErrors?.length ?? 0,
      crashReports: body.diagnostics.emergencyCrashReports?.length ?? 0,
    });
    logger.success({
      status: 200,
      feedbackId,
      externalSource,
      feedbackType: body.type,
      hasScreenshot,
      appVersion: body.diagnostics.appVersion,
    });

    return NextResponse.json({
      success: true,
      message: "Feedback submitted successfully",
      id: feedbackId.toString(),
    });
  } catch (error) {
    logger.error("failed", error, {
      status: 500,
    });
    return NextResponse.json(
      { error: "Failed to process feedback submission" },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve feedback (admin use)
export async function GET(request: NextRequest) {
  const logger = createApiRouteLogger("feedback.GET", { request });
  logger.start();

  const authError = requireApiBearerAuth(request);
  if (authError) {
    logger.warn("auth_failed", { status: authError.status });
    return authError;
  }

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const search = searchParams.get("search");
    const limitParam = searchParams.get("limit");
    const offsetParam = searchParams.get("offset");

    const parsedLimit = limitParam === null ? Number.NaN : Number(limitParam);
    const parsedOffset = offsetParam === null ? 0 : Number(offsetParam);
    const limit = Number.isNaN(parsedLimit)
      ? DEFAULT_FEEDBACK_PAGE_SIZE
      : Math.min(MAX_FEEDBACK_PAGE_SIZE, Math.max(1, Math.trunc(parsedLimit)));
    const offset = Number.isNaN(parsedOffset)
      ? 0
      : Math.max(0, Math.trunc(parsedOffset));

    // Build query dynamically
    const whereClauses: string[] = ["1=1"];
    const args: (string | number)[] = [];

    if (type && type !== "all") {
      whereClauses.push("type = ?");
      args.push(type);
    }

    if (status && status !== "all") {
      whereClauses.push("status = ?");
      args.push(status);
    }

    if (priority && priority !== "all") {
      whereClauses.push("priority = ?");
      args.push(priority);
    }

    if (search && search.trim()) {
      whereClauses.push("description LIKE ?");
      args.push(`%${search.trim()}%`);
    }

    const whereSql = whereClauses.join(" AND ");

    const selectColumns = [
      "id",
      "type",
      "email",
      "description",
      "status",
      "priority",
      "tags",
      "is_read",
      "app_version",
      "macos_version",
      "has_screenshot",
      "external_source",
      "external_id",
      "external_url",
      "created_at",
      "updated_at",
    ].join(", ");

    let sql = `SELECT ${selectColumns} FROM feedback WHERE ${whereSql} ORDER BY datetime(COALESCE(updated_at, created_at)) DESC, id DESC`;
    const queryArgs: (string | number)[] = [...args];
    sql += " LIMIT ? OFFSET ?";
    queryArgs.push(limit + 1, offset);

    const result = await db.execute({ sql, args: queryArgs });
    const feedbackRows = result.rows as Record<string, unknown>[];
    const hasMore = feedbackRows.length > limit;
    const pageRows = hasMore ? feedbackRows.slice(0, limit) : feedbackRows;
    const returnedCount = pageRows.length;
    const estimatedTotal = offset + returnedCount + (hasMore ? 1 : 0);

    logger.success({
      status: 200,
      returnedCount,
      hasMore,
      offset,
      limit,
      estimatedTotal,
    });

    return NextResponse.json({
      count: returnedCount,
      total: estimatedTotal,
      hasMore,
      offset,
      limit,
      feedback: pageRows.map((row) => mapFeedbackSummaryRowToApiItem(row)),
    });
  } catch (error) {
    logger.error("failed", error, { status: 500 });
    return NextResponse.json(
      { error: "Failed to fetch feedback" },
      { status: 500 }
    );
  }
}
