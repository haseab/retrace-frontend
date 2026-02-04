import { NextRequest, NextResponse } from "next/server";
import { db, initDatabase } from "@/lib/db";

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
    recentErrors: string[];
    recentLogs?: string[];
    timestamp: string;
  };
  includeScreenshot: boolean;
  screenshotData?: string; // Base64 encoded PNG
}

// Ensure table exists on first request
let initialized = false;

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

    // Insert into Turso database with new fields (status, priority, notes default values)
    const result = await db.execute({
      sql: `
        INSERT INTO feedback (
          type, email, description, status, priority, notes,
          app_version, build_number, macos_version,
          device_model, total_disk_space, free_disk_space, session_count,
          frame_count, segment_count, database_size_mb, recent_errors,
          recent_logs, has_screenshot, screenshot_data
        ) VALUES (?, ?, ?, 'open', 'medium', '', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        body.type,
        body.email || null,
        body.description,
        body.diagnostics.appVersion,
        body.diagnostics.buildNumber,
        body.diagnostics.macOSVersion,
        body.diagnostics.deviceModel,
        body.diagnostics.totalDiskSpace,
        body.diagnostics.freeDiskSpace,
        body.diagnostics.databaseStats.sessionCount,
        body.diagnostics.databaseStats.frameCount,
        body.diagnostics.databaseStats.segmentCount,
        body.diagnostics.databaseStats.databaseSizeMB,
        JSON.stringify(body.diagnostics.recentErrors),
        JSON.stringify(body.diagnostics.recentLogs || []),
        body.includeScreenshot && body.screenshotData ? 1 : 0,
        body.screenshotData ? Buffer.from(body.screenshotData, "base64") : null,
      ],
    });

    console.log("Feedback saved to Turso:", {
      id: result.lastInsertRowid,
      type: body.type,
      appVersion: body.diagnostics.appVersion,
    });

    return NextResponse.json({
      success: true,
      message: "Feedback submitted successfully",
      id: result.lastInsertRowid?.toString(),
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

    return NextResponse.json({
      count: result.rows.length,
      feedback: result.rows.map((row) => ({
        id: row.id,
        type: row.type,
        email: row.email,
        description: row.description,
        status: row.status || "open",
        priority: row.priority || "medium",
        notes: row.notes || "",
        tags: JSON.parse((row.tags as string) || "[]"),
        appVersion: row.app_version,
        buildNumber: row.build_number,
        macOSVersion: row.macos_version,
        deviceModel: row.device_model,
        totalDiskSpace: row.total_disk_space,
        freeDiskSpace: row.free_disk_space,
        databaseStats: {
          sessionCount: row.session_count,
          frameCount: row.frame_count,
          segmentCount: row.segment_count,
          databaseSizeMB: row.database_size_mb,
        },
        recentErrors: JSON.parse((row.recent_errors as string) || "[]"),
        recentLogs: JSON.parse((row.recent_logs as string) || "[]"),
        hasScreenshot: row.has_screenshot === 1,
        createdAt: row.created_at,
        updatedAt: row.updated_at || row.created_at,
      })),
    });
  } catch (error) {
    console.error("Error fetching feedback:", error);
    return NextResponse.json(
      { error: "Failed to fetch feedback" },
      { status: 500 }
    );
  }
}
