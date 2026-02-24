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
  try {
    // Initialize database on first request
    if (!initialized) {
      await initDatabase();
      initialized = true;
    }

    const body: FeedbackSubmission = await request.json();

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

    const feedbackId = toFeedbackId(result.lastInsertRowid);
    if (feedbackId === null) {
      throw new Error("Failed to determine inserted feedback id");
    }

    await upsertFeedbackDiagnostics(db, feedbackId, {
      settingsSnapshot: body.diagnostics.settingsSnapshot || {},
      recentErrors: body.diagnostics.recentErrors || [],
      recentLogs: body.diagnostics.recentLogs || [],
      displayInfo: body.diagnostics.displayInfo || DEFAULT_DISPLAY_INFO,
      processInfo: body.diagnostics.processInfo || DEFAULT_PROCESS_INFO,
      accessibilityInfo: body.diagnostics.accessibilityInfo || DEFAULT_ACCESSIBILITY_INFO,
      performanceInfo: body.diagnostics.performanceInfo || DEFAULT_PERFORMANCE_INFO,
      emergencyCrashReports: body.diagnostics.emergencyCrashReports || [],
    });

    console.log("Feedback saved to Turso:", {
      id: feedbackId,
      type: body.type,
      appVersion: body.diagnostics.appVersion,
    });

    return NextResponse.json({
      success: true,
      message: "Feedback submitted successfully",
      id: feedbackId.toString(),
    });
  } catch (error) {
    console.error("Error processing feedback:", error);
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

    // Build query dynamically
    let sql = "SELECT * FROM feedback WHERE 1=1";
    const args: (string | number)[] = [];

    if (type && type !== "all") {
      sql += " AND type = ?";
      args.push(type);
    }

    if (status && status !== "all") {
      sql += " AND status = ?";
      args.push(status);
    }

    if (priority && priority !== "all") {
      sql += " AND priority = ?";
      args.push(priority);
    }

    if (search && search.trim()) {
      sql += " AND description LIKE ?";
      args.push(`%${search.trim()}%`);
    }

    sql += " ORDER BY updated_at DESC";

    const result = await db.execute({ sql, args });
    const feedbackRows = result.rows as Record<string, unknown>[];

    const feedbackIds = feedbackRows
      .map((row) => toFeedbackId(row.id))
      .filter((id): id is number => id !== null);

    const normalizedDiagnosticsById = await getNormalizedDiagnosticsByFeedbackIds(db, feedbackIds);

    return NextResponse.json({
      count: feedbackRows.length,
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
