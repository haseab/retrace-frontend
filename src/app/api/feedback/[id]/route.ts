import { NextRequest, NextResponse } from "next/server";
import { db, initDatabase } from "@/lib/db";
import { requireApiBearerAuth } from "@/lib/api-auth";
import {
  getNormalizedDiagnosticsByFeedbackIds,
  mapFeedbackRowToApiItem,
} from "@/lib/feedback-diagnostics";
import { createApiRouteLogger } from "@/lib/api-route-logger";

let initialized = false;
const FEEDBACK_DETAIL_COLUMNS_WITHOUT_RECENT_LOGS = [
  "id",
  "type",
  "email",
  "description",
  "status",
  "priority",
  "notes",
  "tags",
  "is_read",
  "app_version",
  "build_number",
  "macos_version",
  "device_model",
  "total_disk_space",
  "free_disk_space",
  "session_count",
  "frame_count",
  "segment_count",
  "database_size_mb",
  "recent_errors",
  "diagnostics_timestamp",
  "settings_snapshot",
  "display_info",
  "process_info",
  "accessibility_info",
  "performance_info",
  "emergency_crash_reports",
  "display_count",
  "has_screenshot",
  "external_source",
  "external_id",
  "external_url",
  "created_at",
  "updated_at",
].join(", ");

function toFeedbackId(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return Math.trunc(parsed);
}

function parseBooleanQuery(value: string | null): boolean {
  if (!value) {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const logger = createApiRouteLogger("feedback.detail.GET", { request });
  logger.start();

  const authError = requireApiBearerAuth(request);
  if (authError) {
    logger.warn("auth_failed", { status: authError.status });
    return authError;
  }

  try {
    if (!initialized) {
      await initDatabase();
      initialized = true;
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const includeRecentLogs = parseBooleanQuery(searchParams.get("includeRecentLogs"));
    const selectColumns = includeRecentLogs
      ? "*"
      : FEEDBACK_DETAIL_COLUMNS_WITHOUT_RECENT_LOGS;

    const result = await db.execute({
      sql: `SELECT ${selectColumns} FROM feedback WHERE id = ?`,
      args: [id],
    });

    if (result.rows.length === 0) {
      logger.warn("feedback_not_found", { status: 404, feedbackId: id });
      return NextResponse.json(
        { error: "Feedback item not found" },
        { status: 404 }
      );
    }

    const row = result.rows[0] as Record<string, unknown>;
    const feedbackId = toFeedbackId(row.id);
    const normalizedDiagnosticsById = feedbackId
      ? await getNormalizedDiagnosticsByFeedbackIds(db, [feedbackId], {
          includeRecentErrors: true,
          includeRecentLogs,
        })
      : new Map();

    logger.success({
      status: 200,
      feedbackId: id,
      includeRecentLogs,
    });

    return NextResponse.json({
      success: true,
      includeRecentLogs,
      feedback: mapFeedbackRowToApiItem(
        row,
        feedbackId ? normalizedDiagnosticsById.get(feedbackId) : undefined
      ),
    });
  } catch (error) {
    logger.error("failed", error, { status: 500 });
    return NextResponse.json(
      { error: "Failed to fetch feedback detail" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const logger = createApiRouteLogger("feedback.detail.PATCH", { request });
  logger.start();

  const authError = requireApiBearerAuth(request);
  if (authError) {
    logger.warn("auth_failed", { status: authError.status });
    return authError;
  }

  try {
    if (!initialized) {
      await initDatabase();
      initialized = true;
    }

    const { id } = await params;
    const body = await request.json();
    const { status, priority, notes, tags, isRead } = body;

    // Build update query dynamically based on provided fields
    const updates: string[] = [];
    const args: (string | number)[] = [];
    let shouldUpdateTimestamp = false;

    if (status !== undefined) {
      const validStatuses = ["open", "in_progress", "to_notify", "notified", "resolved", "closed", "back_burner"];
      if (!validStatuses.includes(status)) {
        logger.warn("invalid_status", { status: 400, feedbackId: id, requestedStatus: status });
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
          { status: 400 }
        );
      }
      updates.push("status = ?");
      args.push(status);
      shouldUpdateTimestamp = true;
    }

    if (priority !== undefined) {
      const validPriorities = ["low", "medium", "high", "critical"];
      if (!validPriorities.includes(priority)) {
        logger.warn("invalid_priority", { status: 400, feedbackId: id, requestedPriority: priority });
        return NextResponse.json(
          { error: `Invalid priority. Must be one of: ${validPriorities.join(", ")}` },
          { status: 400 }
        );
      }
      updates.push("priority = ?");
      args.push(priority);
      shouldUpdateTimestamp = true;
    }

    if (notes !== undefined) {
      updates.push("notes = ?");
      args.push(notes);
      shouldUpdateTimestamp = true;
    }

    if (tags !== undefined) {
      if (!Array.isArray(tags)) {
        logger.warn("invalid_tags", { status: 400, feedbackId: id });
        return NextResponse.json(
          { error: "Tags must be an array of strings" },
          { status: 400 }
        );
      }
      updates.push("tags = ?");
      args.push(JSON.stringify(tags));
      shouldUpdateTimestamp = true;
    }

    if (isRead !== undefined) {
      if (typeof isRead !== "boolean") {
        logger.warn("invalid_isRead", { status: 400, feedbackId: id });
        return NextResponse.json(
          { error: "isRead must be a boolean" },
          { status: 400 }
        );
      }
      updates.push("is_read = ?");
      args.push(isRead ? 1 : 0);
    }

    if (updates.length === 0) {
      logger.warn("no_valid_updates", { status: 400, feedbackId: id });
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    // Only update the timestamp for content/status/priority/tag changes.
    // Read acknowledgements should not reshuffle issue ordering.
    if (shouldUpdateTimestamp) {
      updates.push("updated_at = datetime('now')");
    }
    args.push(id);

    const sql = `UPDATE feedback SET ${updates.join(", ")} WHERE id = ?`;
    await db.execute({ sql, args });

    // Fetch and return the updated item
    const result = await db.execute({
      sql: "SELECT * FROM feedback WHERE id = ?",
      args: [id],
    });

    if (result.rows.length === 0) {
      logger.warn("feedback_not_found", { status: 404, feedbackId: id });
      return NextResponse.json(
        { error: "Feedback item not found" },
        { status: 404 }
      );
    }

    const row = result.rows[0] as Record<string, unknown>;
    const feedbackId = toFeedbackId(row.id);
    const normalizedDiagnosticsById = feedbackId
      ? await getNormalizedDiagnosticsByFeedbackIds(db, [feedbackId])
      : new Map();

    logger.success({
      status: 200,
      feedbackId: id,
      updatedFields: updates.length,
      shouldUpdateTimestamp,
    });

    return NextResponse.json({
      success: true,
      feedback: mapFeedbackRowToApiItem(
        row,
        feedbackId ? normalizedDiagnosticsById.get(feedbackId) : undefined
      ),
    });
  } catch (error) {
    logger.error("failed", error, { status: 500 });
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
  const logger = createApiRouteLogger("feedback.detail.DELETE", { request });
  logger.start();

  const authError = requireApiBearerAuth(request);
  if (authError) {
    logger.warn("auth_failed", { status: authError.status });
    return authError;
  }

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
      logger.warn("feedback_not_found", { status: 404, feedbackId: id });
      return NextResponse.json(
        { error: "Feedback item not found" },
        { status: 404 }
      );
    }

    await db.execute({
      sql: "DELETE FROM feedback WHERE id = ?",
      args: [id],
    });

    logger.success({
      status: 200,
      feedbackId: id,
    });

    return NextResponse.json({
      success: true,
      message: "Feedback item deleted",
    });
  } catch (error) {
    logger.error("failed", error, { status: 500 });
    return NextResponse.json(
      { error: "Failed to delete feedback" },
      { status: 500 }
    );
  }
}
