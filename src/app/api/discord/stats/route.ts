import { NextRequest, NextResponse } from "next/server";
import { SITE_CONFIG } from "@/lib/config";
import { createApiRouteLogger } from "@/lib/api-route-logger";

interface DiscordInviteResponse {
  approximate_member_count?: number;
  approximate_presence_count?: number;
}

function extractInviteCode(rawInvite: string): string | null {
  const trimmed = rawInvite.trim();
  if (!trimmed) {
    return null;
  }

  // If the env var is already just an invite code, accept it directly.
  if (!trimmed.includes("/")) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    const segments = url.pathname.split("/").filter(Boolean);

    if (url.hostname === "discord.gg") {
      return segments[0] ?? null;
    }

    const inviteIndex = segments.findIndex((segment) => segment === "invite");
    if (inviteIndex !== -1) {
      return segments[inviteIndex + 1] ?? null;
    }
  } catch {
    return null;
  }

  return null;
}

function resolveDiscordInviteUrl(): string {
  return (
    process.env.DISCORD_INVITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_DISCORD_INVITE_URL?.trim() ||
    SITE_CONFIG.links.discord
  );
}

function resolveDiscordInviteCode(inviteUrl: string): string | null {
  return (
    process.env.DISCORD_INVITE_CODE?.trim() ||
    process.env.NEXT_PUBLIC_DISCORD_INVITE_CODE?.trim() ||
    extractInviteCode(inviteUrl)
  );
}

export async function GET(request: NextRequest) {
  const logger = createApiRouteLogger("discord.stats.GET", { request });
  logger.start();

  const inviteUrl = resolveDiscordInviteUrl();
  const inviteCode = resolveDiscordInviteCode(inviteUrl);

  if (!inviteCode) {
    logger.warn("invite_code_missing", { status: 200, inviteUrl });
    return NextResponse.json({
      inviteUrl,
      onlineCount: null,
      memberCount: null,
    });
  }

  try {
    const response = await fetch(
      `https://discord.com/api/v10/invites/${encodeURIComponent(
        inviteCode
      )}?with_counts=true`,
      {
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Discord stats request failed (${response.status})`);
    }

    const payload = (await response.json()) as DiscordInviteResponse;

    logger.success({
      status: 200,
      inviteCode,
      onlineCount:
        typeof payload.approximate_presence_count === "number"
          ? payload.approximate_presence_count
          : null,
      memberCount:
        typeof payload.approximate_member_count === "number"
          ? payload.approximate_member_count
          : null,
    });

    return NextResponse.json({
      inviteUrl,
      onlineCount:
        typeof payload.approximate_presence_count === "number"
          ? payload.approximate_presence_count
          : null,
      memberCount:
        typeof payload.approximate_member_count === "number"
          ? payload.approximate_member_count
          : null,
    });
  } catch (error) {
    logger.error("failed", error, { inviteUrl, inviteCode });
    return NextResponse.json(
      {
        inviteUrl,
        onlineCount: null,
        memberCount: null,
      },
      { status: 502 }
    );
  }
}
