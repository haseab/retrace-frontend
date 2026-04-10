import { NextRequest, NextResponse } from "next/server";
import { requireApiBearerAuth } from "@/lib/api-auth";
import { createApiRouteLogger } from "@/lib/api-route-logger";
import { db } from "@/lib/db";
import { getFeedbackDiagnosticsArchiveById } from "@/lib/feedback-diagnostics";

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
    const feedbackId = Number(id);
    const archiveResult = await getFeedbackDiagnosticsArchiveById(db, feedbackId);

    if (archiveResult.status === "not_found") {
      logger.warn("feedback_not_found", { status: 404, feedbackId: id });
      return NextResponse.json(
        { error: "Feedback item not found" },
        { status: 404 }
      );
    }

    if (archiveResult.status === "unavailable" || !archiveResult.archive) {
      logger.warn("diagnostics_not_found", { status: 404, feedbackId: id });
      return NextResponse.json(
        { error: "No diagnostics archive available for this feedback item" },
        { status: 404 }
      );
    }

    const filename = buildFilename(id, archiveResult.archive.contentEncoding);

    logger.success({
      status: 200,
      feedbackId: id,
      byteLength: archiveResult.archive.payloadData.byteLength,
      contentEncoding: archiveResult.archive.contentEncoding,
      source: archiveResult.source,
    });

    return new NextResponse(new Uint8Array(archiveResult.archive.payloadData), {
      status: 200,
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(archiveResult.archive.payloadData.byteLength),
        "Content-Type": getContentType(archiveResult.archive.contentEncoding),
        "X-Feedback-Diagnostics-Content-Encoding": archiveResult.archive.contentEncoding,
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
