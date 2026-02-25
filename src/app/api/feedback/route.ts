import { NextRequest, NextResponse } from "next/server";
import { db, initDatabase } from "@/lib/db";
import { requireApiBearerAuth } from "@/lib/api-auth";
import { createApiRouteLogger } from "@/lib/api-route-logger";
import {
  DEFAULT_ACCESSIBILITY_INFO,
  DEFAULT_DISPLAY_INFO,
  DEFAULT_PERFORMANCE_INFO,
  DEFAULT_PROCESS_INFO,
  mapFeedbackSummaryRowToApiItem,
  stringifyJson,
  upsertFeedbackDiagnostics,
} from "@/lib/feedback-diagnostics";
import type {
  FeedbackAccessibilityInfo,
  FeedbackDisplayInfo,
  FeedbackPerformanceInfo,
  FeedbackProcessInfo,
} from "@/lib/feedback-diagnostics";

// Feedback submission structure matching FeedbackModels.swift
interface FeedbackSubmission {
  type: string; // "Bug Report" | "Feature Request" | "Question"
  email?: string;
  description: string;
  externalSource?: string; // "app" | "manual" | "github" | "featurebase"
  externalId?: string;
  externalUrl?: string;
  diagnostics: {
    appVersion: string;
    buildNumber: string;
    macOSVersion: string;
    deviceModel: string;
    totalDiskSpace: string;
    freeDiskSpace: string;
    databaseStats: {
      sessionCount: number;
      frameCount: number;
      segmentCount: number;
      databaseSizeMB: number;
    };
    settingsSnapshot?: Record<string, unknown>;
    recentErrors: string[];
    recentLogs?: string[];
    timestamp?: string;
    displayInfo?: FeedbackDisplayInfo;
    processInfo?: FeedbackProcessInfo;
    accessibilityInfo?: FeedbackAccessibilityInfo;
    performanceInfo?: FeedbackPerformanceInfo;
    emergencyCrashReports?: string[];
  };
  includeScreenshot: boolean;
  screenshotData?: string; // Base64 encoded PNG
}

// Ensure table exists on first request
let initialized = false;
const DEFAULT_FEEDBACK_PAGE_SIZE = 30;
const MAX_FEEDBACK_PAGE_SIZE = 50;

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
  logger.start();

  const authError = requireApiBearerAuth(request);
  if (authError) {
    logger.warn("auth_failed", { status: authError.status });
    return authError;
  }

  const requestStartedAt = Date.now();
  const traceId = `${requestStartedAt.toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  console.log(`[feedback][POST][${traceId}] start`, {
    contentLength: request.headers.get("content-length") ?? "unknown",
    contentType: request.headers.get("content-type") ?? "unknown",
  });

  try {
    // Initialize database on first request
    if (!initialized) {
      const initStartedAt = Date.now();
      await initDatabase();
      initialized = true;
      console.log(`[feedback][POST][${traceId}] initDatabase complete`, {
        initMs: elapsedMs(initStartedAt),
      });
    }

    const parseStartedAt = Date.now();
    const body: FeedbackSubmission = await request.json();
    console.log(`[feedback][POST][${traceId}] parsed request body`, {
      parseMs: elapsedMs(parseStartedAt),
      descriptionChars: body.description?.length ?? 0,
      recentLogsCount: body.diagnostics?.recentLogs?.length ?? 0,
      recentErrorsCount: body.diagnostics?.recentErrors?.length ?? 0,
      settingsCount: body.diagnostics?.settingsSnapshot
        ? Object.keys(body.diagnostics.settingsSnapshot).length
        : 0,
      crashReportsCount: body.diagnostics?.emergencyCrashReports?.length ?? 0,
    });

    // Validate required fields
    if (!body.type || !body.description || !body.diagnostics) {
      logger.warn("missing_required_fields", { status: 400 });
      return NextResponse.json(
        { error: "Missing required fields: type, description, or diagnostics" },
        { status: 400 }
      );
    }

    // Validate feedback type
    const validTypes = ["Bug Report", "Feature Request", "Question"];
    if (!validTypes.includes(body.type)) {
      logger.warn("invalid_feedback_type", { status: 400, type: body.type });
      return NextResponse.json(
        { error: `Invalid feedback type. Must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate description is not empty
    if (body.description.trim().length === 0) {
      logger.warn("empty_description", { status: 400 });
      return NextResponse.json(
        { error: "Description cannot be empty" },
        { status: 400 }
      );
    }

    const diagnosticsTimestamp = body.diagnostics.timestamp || new Date().toISOString();
    const displayCount = getDisplayCount(body.diagnostics.displayInfo);
    const externalSource = normalizeExternalSource(
      body.externalSource,
      body.diagnostics.appVersion,
      body.diagnostics.buildNumber
    );
    const externalId = normalizeOptionalText(body.externalId);
    const externalUrl = normalizeOptionalText(body.externalUrl);

    // Insert into Turso database with diagnostics fields
    const insertFeedbackStartedAt = Date.now();
    const result = await db.execute({
      sql: `
        INSERT INTO feedback (
          type, email, description, status, priority, notes, is_read,
          app_version, build_number, macos_version,
          device_model, total_disk_space, free_disk_space, session_count,
          frame_count, segment_count, database_size_mb, recent_errors,
          recent_logs, diagnostics_timestamp, settings_snapshot, display_info,
          process_info, accessibility_info, performance_info, emergency_crash_reports,
          display_count, has_screenshot, screenshot_data, external_source, external_id, external_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        body.type,
        body.email || null,
        body.description,
        "open",
        "medium",
        "",
        0,
        body.diagnostics.appVersion,
        body.diagnostics.buildNumber,
        body.diagnostics.macOSVersion,
        body.diagnostics.deviceModel,
        body.diagnostics.totalDiskSpace,
        body.diagnostics.freeDiskSpace,
        body.diagnostics.databaseStats?.sessionCount ?? 0,
        body.diagnostics.databaseStats?.frameCount ?? 0,
        body.diagnostics.databaseStats?.segmentCount ?? 0,
        body.diagnostics.databaseStats?.databaseSizeMB ?? 0,
        stringifyJson(body.diagnostics.recentErrors, []),
        stringifyJson(body.diagnostics.recentLogs || [], []),
        diagnosticsTimestamp,
        stringifyJson(body.diagnostics.settingsSnapshot || {}, {}),
        stringifyJson(body.diagnostics.displayInfo || DEFAULT_DISPLAY_INFO, DEFAULT_DISPLAY_INFO),
        stringifyJson(body.diagnostics.processInfo || DEFAULT_PROCESS_INFO, DEFAULT_PROCESS_INFO),
        stringifyJson(body.diagnostics.accessibilityInfo || DEFAULT_ACCESSIBILITY_INFO, DEFAULT_ACCESSIBILITY_INFO),
        stringifyJson(body.diagnostics.performanceInfo || DEFAULT_PERFORMANCE_INFO, DEFAULT_PERFORMANCE_INFO),
        stringifyJson(body.diagnostics.emergencyCrashReports || [], []),
        displayCount,
        body.includeScreenshot && body.screenshotData ? 1 : 0,
        body.screenshotData ? Buffer.from(body.screenshotData, "base64") : null,
        externalSource,
        externalId,
        externalUrl,
      ],
    });
    console.log(`[feedback][POST][${traceId}] inserted feedback row`, {
      insertFeedbackMs: elapsedMs(insertFeedbackStartedAt),
      rowId: result.lastInsertRowid?.toString() ?? "unknown",
      displayCount,
      includeScreenshot: Boolean(body.includeScreenshot && body.screenshotData),
    });

    const feedbackId = toFeedbackId(result.lastInsertRowid);
    if (feedbackId === null) {
      throw new Error("Failed to determine inserted feedback id");
    }

    const diagnosticsWriteStartedAt = Date.now();
    await upsertFeedbackDiagnostics(db, feedbackId, {
      settingsSnapshot: body.diagnostics.settingsSnapshot || {},
      recentErrors: body.diagnostics.recentErrors || [],
      recentLogs: body.diagnostics.recentLogs || [],
      displayInfo: body.diagnostics.displayInfo || DEFAULT_DISPLAY_INFO,
      processInfo: body.diagnostics.processInfo || DEFAULT_PROCESS_INFO,
      accessibilityInfo: body.diagnostics.accessibilityInfo || DEFAULT_ACCESSIBILITY_INFO,
      performanceInfo: body.diagnostics.performanceInfo || DEFAULT_PERFORMANCE_INFO,
      emergencyCrashReports: body.diagnostics.emergencyCrashReports || [],
    }, {
      traceId,
      logTimings: true,
    });
    console.log(`[feedback][POST][${traceId}] diagnostics persisted`, {
      diagnosticsWriteMs: elapsedMs(diagnosticsWriteStartedAt),
    });

    console.log("Feedback saved to Turso:", {
      id: feedbackId,
      type: body.type,
      appVersion: body.diagnostics.appVersion,
    });
    console.log(`[feedback][POST][${traceId}] success`, {
      totalMs: elapsedMs(requestStartedAt),
      feedbackId,
    });
    logger.success({
      status: 200,
      feedbackId,
      externalSource,
      totalMs: elapsedMs(requestStartedAt),
    });

    return NextResponse.json({
      success: true,
      message: "Feedback submitted successfully",
      id: feedbackId.toString(),
    });
  } catch (error) {
    console.error(`[feedback][POST][${traceId}] failed`, {
      totalMs: elapsedMs(requestStartedAt),
      error,
    });
    logger.error("failed", error, {
      status: 500,
      totalMs: elapsedMs(requestStartedAt),
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
    // Initialize database on first request
    if (!initialized) {
      await initDatabase();
      initialized = true;
    }

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

    let sql = `SELECT ${selectColumns} FROM feedback WHERE ${whereSql} ORDER BY updated_at DESC`;
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
