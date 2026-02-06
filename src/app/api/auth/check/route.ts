import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const sessionCookie = request.cookies.get("admin_session");

  // Simple check - just verify cookie exists
  // In production, you'd validate against a session store
  if (sessionCookie?.value) {
    return NextResponse.json({ authenticated: true });
  }

  return NextResponse.json({ authenticated: false }, { status: 401 });
}
