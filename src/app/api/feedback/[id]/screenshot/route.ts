import { NextRequest, NextResponse } from "next/server";
import { db, initDatabase } from "@/lib/db";

let initialized = false;

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
      sql: "SELECT screenshot_data, has_screenshot FROM feedback WHERE id = ?",
      args: [id],
    });

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Feedback item not found" },
        { status: 404 }
      );
    }

    const row = result.rows[0];

    if (!row.has_screenshot || !row.screenshot_data) {
      return NextResponse.json(
        { error: "No screenshot available for this feedback item" },
        { status: 404 }
      );
    }

    // The screenshot_data is stored as a BLOB (Buffer)
    const screenshotBuffer = row.screenshot_data as ArrayBuffer;

    return new NextResponse(screenshotBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Error fetching screenshot:", error);
    return NextResponse.json(
      { error: "Failed to fetch screenshot" },
      { status: 500 }
    );
  }
}
