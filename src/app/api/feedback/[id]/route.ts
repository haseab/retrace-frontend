import { NextRequest, NextResponse } from "next/server";
import { db, initDatabase } from "@/lib/db";

let initialized = false;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!initialized) {
      await initDatabase();
      initialized = true;
    }

    const { id } = await params;
    const body = await request.json();
    const { status, priority, notes, tags } = body;

    // Build update query dynamically based on provided fields
    const updates: string[] = [];
    const args: (string | number)[] = [];

    if (status !== undefined) {
      const validStatuses = ["open", "in_progress", "resolved", "closed"];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
          { status: 400 }
        );
      }
      updates.push("status = ?");
      args.push(status);
    }

    if (priority !== undefined) {
      const validPriorities = ["low", "medium", "high", "critical"];
      if (!validPriorities.includes(priority)) {
        return NextResponse.json(
          { error: `Invalid priority. Must be one of: ${validPriorities.join(", ")}` },
          { status: 400 }
        );
      }
      updates.push("priority = ?");
      args.push(priority);
    }

    if (notes !== undefined) {
      updates.push("notes = ?");
      args.push(notes);
    }

    if (tags !== undefined) {
      if (!Array.isArray(tags)) {
        return NextResponse.json(
          { error: "Tags must be an array of strings" },
          { status: 400 }
        );
      }
      updates.push("tags = ?");
      args.push(JSON.stringify(tags));
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    // Always update the updated_at timestamp
    updates.push("updated_at = datetime('now')");
    args.push(id);

    const sql = `UPDATE feedback SET ${updates.join(", ")} WHERE id = ?`;
    await db.execute({ sql, args });

    // Fetch and return the updated item
    const result = await db.execute({
      sql: "SELECT * FROM feedback WHERE id = ?",
      args: [id],
    });

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Feedback item not found" },
        { status: 404 }
      );
    }

    const row = result.rows[0];
    return NextResponse.json({
      success: true,
      feedback: {
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
      },
    });
  } catch (error) {
    console.error("Error updating feedback:", error);
    console.error("Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    return NextResponse.json(
      { error: "Failed to update feedback", details: errorMessage, stack: errorStack },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!initialized) {
      await initDatabase();
      initialized = true;
    }

    const { id } = await params;

    // Check if item exists
    const existing = await db.execute({
      sql: "SELECT id FROM feedback WHERE id = ?",
      args: [id],
    });

    if (existing.rows.length === 0) {
      return NextResponse.json(
        { error: "Feedback item not found" },
        { status: 404 }
      );
    }

    await db.execute({
      sql: "DELETE FROM feedback WHERE id = ?",
      args: [id],
    });

    return NextResponse.json({
      success: true,
      message: "Feedback item deleted",
    });
  } catch (error) {
    console.error("Error deleting feedback:", error);
    return NextResponse.json(
      { error: "Failed to delete feedback" },
      { status: 500 }
    );
  }
}
