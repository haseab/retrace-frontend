import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// In-memory rate limiting (resets on server restart, but good enough for basic protection)
const loginAttempts = new Map<string, { count: number; lastAttempt: number; lockedUntil: number }>();

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
const ATTEMPT_WINDOW = 5 * 60 * 1000; // 5 minutes

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") || "unknown";
}

function checkRateLimit(ip: string): { allowed: boolean; remainingAttempts: number; lockedUntil?: number } {
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (!record) {
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }

  // Check if locked out
  if (record.lockedUntil > now) {
    return { allowed: false, remainingAttempts: 0, lockedUntil: record.lockedUntil };
  }

  // Reset if outside attempt window
  if (now - record.lastAttempt > ATTEMPT_WINDOW) {
    loginAttempts.delete(ip);
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }

  const remainingAttempts = MAX_ATTEMPTS - record.count;
  return { allowed: remainingAttempts > 0, remainingAttempts: Math.max(0, remainingAttempts) };
}

function recordAttempt(ip: string, success: boolean): void {
  const now = Date.now();

  if (success) {
    loginAttempts.delete(ip);
    return;
  }

  const record = loginAttempts.get(ip);
  if (!record || now - record.lastAttempt > ATTEMPT_WINDOW) {
    loginAttempts.set(ip, { count: 1, lastAttempt: now, lockedUntil: 0 });
  } else {
    record.count++;
    record.lastAttempt = now;
    if (record.count >= MAX_ATTEMPTS) {
      record.lockedUntil = now + LOCKOUT_DURATION;
    }
  }
}

async function hashPassword(password: string): Promise<string> {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);

  // Check rate limit
  const rateLimit = checkRateLimit(ip);
  if (!rateLimit.allowed) {
    const retryAfter = rateLimit.lockedUntil
      ? Math.ceil((rateLimit.lockedUntil - Date.now()) / 1000)
      : 60;
    return NextResponse.json(
      {
        error: "Too many login attempts. Please try again later.",
        retryAfter,
      },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfter) },
      }
    );
  }

  try {
    const { password } = await request.json();

    if (!password || typeof password !== "string") {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
    }

    // Get expected hash from environment variable
    const expectedHash = process.env.ADMIN_PASSWORD_HASH;
    if (!expectedHash) {
      console.error("ADMIN_PASSWORD_HASH environment variable not set");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    // Hash the provided password and compare
    const providedHash = await hashPassword(password);
    const isValid = crypto.timingSafeEqual(
      Buffer.from(providedHash),
      Buffer.from(expectedHash)
    );

    recordAttempt(ip, isValid);

    if (isValid) {
      // Generate a session token
      const sessionToken = crypto.randomBytes(32).toString("hex");
      const response = NextResponse.json({ success: true });

      // Set HTTP-only cookie for session
      response.cookies.set("admin_session", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24, // 24 hours
        path: "/",
      });

      return response;
    } else {
      const remaining = rateLimit.remainingAttempts - 1;
      return NextResponse.json(
        {
          error: "Invalid password",
          remainingAttempts: remaining,
        },
        { status: 401 }
      );
    }
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
