import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiBearerAuth } from "@/lib/api-auth";
import { createApiRouteLogger } from "@/lib/api-route-logger";

function toBuffer(value: unknown): Buffer | null {
  if (value instanceof ArrayBuffer) {
    return Buffer.from(value);
  }

  if (ArrayBuffer.isView(value)) {
    return Buffer.from(value.buffer, value.byteOffset, value.byteLength);
  }

  return Buffer.isBuffer(value) ? value : null;
}

function buildFilename(feedbackId: string, contentEncoding: string): string {
  const normalizedId = feedbackId.replace(/[^a-zA-Z0-9_-]/g, "") || "unknown";
  return contentEncoding === "gzip"
    ? `feedback-issue-${normalizedId}-diagnostics.json.gz`
    : `feedback-issue-${normalizedId}-diagnostics.json`;
}

function getContentType(contentEncoding: string): string {
  return contentEncoding === "gzip"
    ? "application/gzip"
    : "application/octet-stream";
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const logger = createApiRouteLogger("feedback.diagnostics.GET", { request });
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
        SELECT
          feedback.id AS feedback_id,
          feedback_diagnostics_raw.content_encoding AS content_encoding,
          feedback_diagnostics_raw.payload_data AS payload_data
        FROM feedback
        LEFT JOIN feedback_diagnostics_raw
          ON feedback_diagnostics_raw.feedback_id = feedback.id
        WHERE feedback.id = ?
      `,
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
    const payloadBuffer = toBuffer(row.payload_data);
    if (!payloadBuffer) {
      logger.warn("diagnostics_not_found", { status: 404, feedbackId: id });
      return NextResponse.json(
        { error: "No diagnostics archive available for this feedback item" },
        { status: 404 }
      );
    }

    const contentEncoding =
      typeof row.content_encoding === "string" &&
      row.content_encoding.trim().length > 0
        ? row.content_encoding.trim().toLowerCase()
        : "identity";
    const filename = buildFilename(id, contentEncoding);

    logger.success({
      status: 200,
      feedbackId: id,
      byteLength: payloadBuffer.byteLength,
      contentEncoding,
    });

    return new NextResponse(new Uint8Array(payloadBuffer), {
      status: 200,
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(payloadBuffer.byteLength),
        "Content-Type": getContentType(contentEncoding),
        "X-Feedback-Diagnostics-Content-Encoding": contentEncoding,
      },
    });
  } catch (error) {
    logger.error("failed", error, { status: 500 });
    return NextResponse.json(
      { error: "Failed to fetch diagnostics archive" },
      { status: 500 }
    );
  }
}
