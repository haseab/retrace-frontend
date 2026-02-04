import { NextRequest, NextResponse } from "next/server";
import { db, initDatabase } from "@/lib/db";

let initialized = false;

// DELETE - Remove a note
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
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
      return NextResponse.json(
        { error: "Note not found" },
        { status: 404 }
      );
    }

    await db.execute({
      sql: "DELETE FROM feedback_notes WHERE id = ?",
      args: [noteId],
    });

    return NextResponse.json({
      success: true,
      message: "Note deleted",
    });
  } catch (error) {
    console.error("Error deleting note:", error);
    return NextResponse.json(
      { error: "Failed to delete note" },
      { status: 500 }
    );
  }
}
