import { NextRequest, NextResponse } from "next/server";
import { db, initDatabase } from "@/lib/db";

let initialized = false;

// GET - Fetch all notes for a feedback item
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    console.error("Error fetching notes:", error);
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
  try {
    if (!initialized) {
      await initDatabase();
      initialized = true;
    }

    const { id } = await params;
    const body = await request.json();
    const { author, content } = body;

    if (!author || !content) {
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
    console.error("Error adding note:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to add note", details: errorMessage },
      { status: 500 }
    );
  }
}
