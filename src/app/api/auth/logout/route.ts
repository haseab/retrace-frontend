import { NextRequest, NextResponse } from "next/server";
import { createApiRouteLogger } from "@/lib/api-route-logger";

export async function POST(request: NextRequest) {
  const logger = createApiRouteLogger("auth.logout.POST", { request });
  logger.start();

  const response = NextResponse.json({ success: true });

  // Clear the session cookie
  response.cookies.set("admin_session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0,
    path: "/",
  });

  logger.success({ status: 200 });
  return response;
}
