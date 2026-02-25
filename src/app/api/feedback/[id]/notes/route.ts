import { NextRequest, NextResponse } from "next/server";
import { db, initDatabase } from "@/lib/db";
import { requireApiBearerAuth } from "@/lib/api-auth";
import { createApiRouteLogger } from "@/lib/api-route-logger";

let initialized = false;

// GET - Fetch all notes for a feedback item
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const logger = createApiRouteLogger("feedback.notes.GET", { request });
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

    const result = await db.execute({
      sql: "SELECT * FROM feedback_notes WHERE feedback_id = ? ORDER BY created_at DESC",
      args: [id],
    });

    logger.success({
      status: 200,
      feedbackId: id,
      noteCount: result.rows.length,
    });

    return NextResponse.json({
      notes: result.rows.map((row) => ({
        id: row.id,
        feedbackId: row.feedback_id,
        author: row.author,
        content: row.content,
        createdAt: row.created_at,
      })),
    });
  } catch (error) {
    logger.error("failed", error, { status: 500 });
    return NextResponse.json(
      { error: "Failed to fetch notes" },
      { status: 500 }
    );
  }
}

// POST - Add a new note to a feedback item
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const logger = createApiRouteLogger("feedback.notes.POST", { request });
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
    const { author, content } = body;

    if (!author || !content) {
      logger.warn("missing_author_or_content", { status: 400, feedbackId: id });
      return NextResponse.json(
        { error: "Author and content are required" },
        { status: 400 }
      );
    }

    // Check if feedback exists
    const feedbackExists = await db.execute({
      sql: "SELECT id FROM feedback WHERE id = ?",
      args: [id],
    });

    if (feedbackExists.rows.length === 0) {
      logger.warn("feedback_not_found", { status: 404, feedbackId: id });
      return NextResponse.json(
        { error: "Feedback item not found" },
        { status: 404 }
      );
    }

    // Insert the note
    const result = await db.execute({
      sql: "INSERT INTO feedback_notes (feedback_id, author, content) VALUES (?, ?, ?)",
      args: [id, author, content],
    });

    // Update feedback's updated_at timestamp
    await db.execute({
      sql: "UPDATE feedback SET updated_at = datetime('now') WHERE id = ?",
      args: [id],
    });

    logger.success({
      status: 200,
      feedbackId: id,
      noteId: Number(result.lastInsertRowid),
    });

    return NextResponse.json({
      success: true,
      note: {
        id: Number(result.lastInsertRowid),
        feedbackId: parseInt(id),
        author,
        content,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error("failed", error, { status: 500 });
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to add note", details: errorMessage },
      { status: 500 }
    );
  }
}
