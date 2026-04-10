import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiBearerAuth } from "@/lib/api-auth";
import { createApiRouteLogger } from "@/lib/api-route-logger";
import { toBufferFromBlob } from "@/lib/blob-utils";

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
    const { id } = await params;

    const result = await db.execute({
      sql: `
        SELECT screenshot_data
        FROM feedback_screenshots
        WHERE feedback_id = ?
      `,
      args: [id],
    });

    const row = result.rows[0];
    const screenshotBuffer = row
      ? toBufferFromBlob(row.screenshot_data)
      : null;

    if (!screenshotBuffer) {
      logger.warn("screenshot_not_found", { status: 404, feedbackId: id });
      return NextResponse.json(
        { error: "No screenshot available for this feedback item" },
        { status: 404 }
      );
    }

    logger.success({
      status: 200,
      feedbackId: id,
      byteLength: screenshotBuffer.byteLength,
      source: "feedback_screenshots",
    });

    return new NextResponse(new Uint8Array(screenshotBuffer), {
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
