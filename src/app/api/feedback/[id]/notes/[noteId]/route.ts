import { NextRequest, NextResponse } from "next/server";
import { db, initDatabase } from "@/lib/db";
import { requireApiBearerAuth } from "@/lib/api-auth";
import { createApiRouteLogger } from "@/lib/api-route-logger";

let initialized = false;

// DELETE - Remove a note
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  const logger = createApiRouteLogger("feedback.notes.note.DELETE", { request });
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

    const { id, noteId } = await params;

    // Check if note exists and belongs to this feedback
    const noteExists = await db.execute({
      sql: "SELECT id FROM feedback_notes WHERE id = ? AND feedback_id = ?",
      args: [noteId, id],
    });

    if (noteExists.rows.length === 0) {
      logger.warn("note_not_found", { status: 404, feedbackId: id, noteId });
      return NextResponse.json(
        { error: "Note not found" },
        { status: 404 }
      );
    }

    await db.execute({
      sql: "DELETE FROM feedback_notes WHERE id = ?",
      args: [noteId],
    });

    logger.success({
      status: 200,
      feedbackId: id,
      noteId,
    });

    return NextResponse.json({
      success: true,
      message: "Note deleted",
    });
  } catch (error) {
    logger.error("failed", error, { status: 500 });
    return NextResponse.json(
      { error: "Failed to delete note" },
      { status: 500 }
    );
  }
}
