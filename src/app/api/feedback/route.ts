import { NextRequest, NextResponse } from "next/server";
import { db, initDatabase } from "@/lib/db";
import {
  DEFAULT_ACCESSIBILITY_INFO,
  DEFAULT_DISPLAY_INFO,
  DEFAULT_PERFORMANCE_INFO,
  DEFAULT_PROCESS_INFO,
  getNormalizedDiagnosticsByFeedbackIds,
  mapFeedbackRowToApiItem,
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

export async function POST(request: NextRequest) {
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
      return NextResponse.json(
        { error: "Missing required fields: type, description, or diagnostics" },
        { status: 400 }
      );
    }

    // Validate feedback type
    const validTypes = ["Bug Report", "Feature Request", "Question"];
    if (!validTypes.includes(body.type)) {
      return NextResponse.json(
        { error: `Invalid feedback type. Must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate description is not empty
    if (body.description.trim().length === 0) {
      return NextResponse.json(
        { error: "Description cannot be empty" },
        { status: 400 }
      );
    }

    const diagnosticsTimestamp = body.diagnostics.timestamp || new Date().toISOString();
    const displayCount = getDisplayCount(body.diagnostics.displayInfo);

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
          display_count, has_screenshot, screenshot_data
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    return NextResponse.json(
      { error: "Failed to process feedback submission" },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve feedback (admin use)
export async function GET(request: NextRequest) {
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

    const parsedLimit = limitParam === null ? null : Number(limitParam);
    const parsedOffset = offsetParam === null ? 0 : Number(offsetParam);
    const limit = parsedLimit === null || Number.isNaN(parsedLimit)
      ? null
      : Math.min(100, Math.max(1, Math.trunc(parsedLimit)));
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

    const countResult = await db.execute({
      sql: `SELECT COUNT(*) AS total FROM feedback WHERE ${whereSql}`,
      args,
    });
    const totalRaw = countResult.rows[0]?.total;
    const parsedTotal = typeof totalRaw === "number" ? totalRaw : Number(totalRaw ?? 0);
    const total = Number.isFinite(parsedTotal) ? Math.max(0, Math.trunc(parsedTotal)) : 0;

    let sql = `SELECT * FROM feedback WHERE ${whereSql} ORDER BY updated_at DESC`;
    const queryArgs: (string | number)[] = [...args];

    if (limit !== null) {
      sql += " LIMIT ? OFFSET ?";
      queryArgs.push(limit, offset);
    }

    const result = await db.execute({ sql, args: queryArgs });
    const feedbackRows = result.rows as Record<string, unknown>[];

    const feedbackIds = feedbackRows
      .map((row) => toFeedbackId(row.id))
      .filter((id): id is number => id !== null);

    const normalizedDiagnosticsById = await getNormalizedDiagnosticsByFeedbackIds(db, feedbackIds);
    const returnedCount = feedbackRows.length;
    const hasMore = limit !== null && offset + returnedCount < total;

    return NextResponse.json({
      count: returnedCount,
      total,
      hasMore,
      offset: limit === null ? 0 : offset,
      limit: limit ?? returnedCount,
      feedback: feedbackRows.map((row) => {
        const feedbackId = toFeedbackId(row.id);
        const diagnostics = feedbackId === null ? undefined : normalizedDiagnosticsById.get(feedbackId);
        return mapFeedbackRowToApiItem(row, diagnostics);
      }),
    });
  } catch (error) {
    console.error("Error fetching feedback:", error);
    return NextResponse.json(
      { error: "Failed to fetch feedback" },
      { status: 500 }
    );
  }
}
