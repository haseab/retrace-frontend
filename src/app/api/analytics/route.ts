import { NextRequest, NextResponse } from "next/server";
import { requireApiBearerAuth } from "@/lib/api-auth";
import { getDownloadAnalyticsPayload } from "@/lib/download-analytics";
import { fetchCloudflareR2VersionHistory } from "@/lib/cloudflare-r2-analytics";
import { createApiRouteLogger } from "@/lib/api-route-logger";

export async function GET(request: NextRequest) {
  const logger = createApiRouteLogger("analytics.GET", { request });
  logger.start();

  const authError = requireApiBearerAuth(request);
  if (authError) {
    logger.warn("auth_failed", { status: authError.status });
    return authError;
  }

  try {
    const [payload, cloudflareR2History] = await Promise.all([
      getDownloadAnalyticsPayload(),
      fetchCloudflareR2VersionHistory(),
    ]);

    logger.success({
      status: 200,
      totalDownloads: payload.totalDownloads,
      r2HistoryPoints: Array.isArray(cloudflareR2History.history)
        ? cloudflareR2History.history.length
        : 0,
      r2HistoryError: cloudflareR2History.error ?? null,
    });

    return NextResponse.json({
      ...payload,
      r2VersionHistory: cloudflareR2History.history,
      r2VersionHistoryError: cloudflareR2History.error,
    });
  } catch (error) {
    logger.error("failed", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
