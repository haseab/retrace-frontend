import { NextRequest, NextResponse } from "next/server";
import { db, initDatabase } from "@/lib/db";
import { requireApiBearerAuth } from "@/lib/api-auth";
import { createApiRouteLogger } from "@/lib/api-route-logger";

let initialized = false;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const logger = createApiRouteLogger("feedback.screenshot.GET", { request });
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
      sql: "SELECT screenshot_data, has_screenshot FROM feedback WHERE id = ?",
      args: [id],
    });

    if (result.rows.length === 0) {
      logger.warn("feedback_not_found", { status: 404, feedbackId: id });
      return NextResponse.json(
        { error: "Feedback item not found" },
        { status: 404 }
      );
    }

    const row = result.rows[0];

    if (!row.has_screenshot || !row.screenshot_data) {
      logger.warn("screenshot_not_found", { status: 404, feedbackId: id });
      return NextResponse.json(
        { error: "No screenshot available for this feedback item" },
        { status: 404 }
      );
    }

    // The screenshot_data is stored as a BLOB (Buffer)
    const screenshotBuffer = row.screenshot_data as ArrayBuffer;

    logger.success({
      status: 200,
      feedbackId: id,
      byteLength: screenshotBuffer.byteLength,
    });

    return new NextResponse(screenshotBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    logger.error("failed", error, { status: 500 });
    return NextResponse.json(
      { error: "Failed to fetch screenshot" },
      { status: 500 }
    );
  }
}
