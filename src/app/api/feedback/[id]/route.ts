import { NextRequest, NextResponse } from "next/server";
import { db, initDatabase } from "@/lib/db";
import {
  getNormalizedDiagnosticsByFeedbackIds,
  mapFeedbackRowToApiItem,
} from "@/lib/feedback-diagnostics";

let initialized = false;

function toFeedbackId(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return Math.trunc(parsed);
}

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
    const { status, priority, notes, tags, isRead } = body;

    // Build update query dynamically based on provided fields
    const updates: string[] = [];
    const args: (string | number)[] = [];
    let shouldUpdateTimestamp = false;

    if (status !== undefined) {
      const validStatuses = ["open", "in_progress", "to_notify", "resolved", "closed"];
      if (!validStatuses.includes(status)) {
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
        return NextResponse.json(
          { error: "isRead must be a boolean" },
          { status: 400 }
        );
      }
      updates.push("is_read = ?");
      args.push(isRead ? 1 : 0);
    }

    if (updates.length === 0) {
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

    return NextResponse.json({
      success: true,
      feedback: mapFeedbackRowToApiItem(
        row,
        feedbackId ? normalizedDiagnosticsById.get(feedbackId) : undefined
      ),
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
