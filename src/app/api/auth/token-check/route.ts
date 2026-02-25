import { NextRequest, NextResponse } from "next/server";
import { requireApiBearerAuth } from "@/lib/api-auth";
import { createApiRouteLogger } from "@/lib/api-route-logger";

export async function GET(request: NextRequest) {
  const logger = createApiRouteLogger("auth.token-check.GET", { request });
  logger.start();

  const authError = requireApiBearerAuth(request);
  if (authError) {
    logger.warn("auth_failed", { status: authError.status });
    return authError;
  }

  logger.success({ status: 200 });
  return NextResponse.json({ success: true });
}
