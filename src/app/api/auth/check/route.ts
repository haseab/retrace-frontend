import { NextRequest, NextResponse } from "next/server";
import { createApiRouteLogger } from "@/lib/api-route-logger";

export async function GET(request: NextRequest) {
  const logger = createApiRouteLogger("auth.check.GET", { request });
  logger.start();

  const sessionCookie = request.cookies.get("admin_session");

  // Simple check - just verify cookie exists
  // In production, you'd validate against a session store
  if (sessionCookie?.value) {
    logger.success({
      status: 200,
      authenticated: true,
    });
    return NextResponse.json({ authenticated: true });
  }

  logger.warn("unauthenticated", { status: 401 });
  return NextResponse.json({ authenticated: false }, { status: 401 });
}
