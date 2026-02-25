"use client";

import { SITE_CONFIG } from "@/lib/config";
import { useEffect, useMemo, useState } from "react";
import { FaDiscord } from "react-icons/fa";
import PingDot from "@/components/ui/ping-dot";

interface DiscordStatsResponse {
  inviteUrl: string;
  onlineCount: number | null;
  memberCount: number | null;
}

function formatCount(value: number | null): string {
  if (value === null) {
    return "—";
  }
  return value.toLocaleString();
}

export function DiscordCard() {
  const [stats, setStats] = useState<DiscordStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isDisposed = false;

    const fetchStats = async () => {
      try {
        const response = await fetch("/api/discord/stats", {
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error(`Discord stats request failed (${response.status})`);
        }

        const payload = (await response.json()) as DiscordStatsResponse;
        if (isDisposed) {
          return;
        }

        setStats(payload);
        setHasError(false);
      } catch (error) {
        console.error("Failed to fetch Discord stats:", error);
        if (!isDisposed) {
          setHasError(true);
        }
      } finally {
        if (!isDisposed) {
          setIsLoading(false);
        }
      }
    };

    fetchStats();
    const intervalId = window.setInterval(fetchStats, 60_000);

    return () => {
      isDisposed = true;
      window.clearInterval(intervalId);
    };
  }, []);

  const inviteUrl = useMemo(
    () => stats?.inviteUrl || SITE_CONFIG.links.discord,
    [stats?.inviteUrl],
  );
  const onlineCount = stats?.onlineCount ?? null;
  const memberCount = stats?.memberCount ?? null;
  const hasLiveStats =
    !hasError && onlineCount !== null && memberCount !== null;
  const onlineLabel = isLoading && !stats ? "..." : formatCount(onlineCount);
  const memberLabel = isLoading && !stats ? "..." : formatCount(memberCount);

  return (
    <div className="relative h-full overflow-hidden rounded-xl border border-[#5865F2]/30 bg-gradient-to-br from-[#5865F2]/15 via-card to-card p-8">
      <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[#5865F2]/20 blur-2xl" />
      <div className="relative flex h-full flex-col gap-5">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-[#5865F2]/20 p-2 ring-1 ring-[#5865F2]/30">
            <FaDiscord className="h-5 w-5 text-[#A7B0FF]" />
          </div>
          <h2 className="text-2xl font-bold">Discord</h2>
        </div>

        <p className="text-muted-foreground">
          Where you'll find me and the community hanging out.
        </p>

        {hasError && (
          <p className="text-xs text-muted-foreground">
            Live Discord stats are temporarily unavailable.
          </p>
        )}

        <a
          href={inviteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto inline-flex h-11 w-full items-center justify-between gap-2 rounded-full border border-border/70 bg-background/70 px-3.5 text-sm font-semibold text-foreground transition-colors hover:border-[#5865F2]/55 hover:bg-[#5865F2]/18"
        >
          <span className="inline-flex items-center gap-2 justify-center w-full">
            <FaDiscord className="h-3.5 w-3.5 text-foreground" />
            <PingDot color={hasLiveStats ? "green" : "red"} className="mx-0" />
            <span className="text-md leading-none font-semibold tabular-nums">
              {onlineLabel}
            </span>
            <span className="text-md tracking-wide text-muted-foreground">
              Online
            </span>
          </span>
          {/* <span className="text-xs font-semibold tabular-nums text-foreground/90">
            {memberLabel} Members
          </span> */}
        </a>
      </div>
    </div>
  );
}
