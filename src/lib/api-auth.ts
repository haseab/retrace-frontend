import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

const BEARER_PREFIX = "Bearer ";
const BEARER_TOKEN_ENV_KEY = "BEARER_TOKEN";

interface ApiAuthFailure {
  ok: false;
  reason: string;
  status: 401 | 500;
}

interface ApiAuthSuccess {
  ok: true;
}

type ApiAuthResult = ApiAuthSuccess | ApiAuthFailure;

function getConfiguredApiSecret(): string | null {
  const raw = process.env[BEARER_TOKEN_ENV_KEY];
  if (!raw) {
    return null;
  }

  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith(BEARER_PREFIX)) {
    return null;
  }

  const token = authHeader.slice(BEARER_PREFIX.length).trim();
  return token.length > 0 ? token : null;
}

function timingSafeTokenMatch(provided: string, expected: string): boolean {
  const providedBytes = Buffer.from(provided);
  const expectedBytes = Buffer.from(expected);

  if (providedBytes.length !== expectedBytes.length) {
    return false;
  }

  return crypto.timingSafeEqual(providedBytes, expectedBytes);
}

function authorizeApiRequest(request: NextRequest): ApiAuthResult {
  const configuredSecret = getConfiguredApiSecret();
  if (!configuredSecret) {
    return {
      ok: false,
      status: 500,
      reason: "Configure BEARER_TOKEN on the server.",
    };
  }

  const token = extractBearerToken(request.headers.get("authorization"));
  if (!token) {
    return {
      ok: false,
      status: 401,
      reason: "Missing bearer token.",
    };
  }

  if (!timingSafeTokenMatch(token, configuredSecret)) {
    return {
      ok: false,
      status: 401,
      reason: "Invalid bearer token.",
    };
  }

  return { ok: true };
}

export function requireApiBearerAuth(request: NextRequest): NextResponse | null {
  const auth = authorizeApiRequest(request);
  if (auth.ok) {
    return null;
  }

  if (auth.status === 500) {
    return NextResponse.json(
      {
        success: false,
        error: "Server configuration error",
        details: auth.reason,
      },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      success: false,
      error: "Unauthorized",
      details: auth.reason,
    },
    { status: 401 }
  );
}
