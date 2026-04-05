"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  Clock3,
  Grid2x2,
  Link2,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";
import type { SiteAnalytics } from "@/lib/types/feedback";
import { StatsCards } from "@/components/admin/analytics/stats-cards";
import { DownloadChart } from "@/components/admin/analytics/download-chart";
import { RecentDownloads } from "@/components/admin/analytics/recent-downloads";
import { RecentLinkClicks } from "@/components/admin/analytics/recent-link-clicks";
import { MetricCard } from "@/components/admin/analytics/metric-card";
import {
  TimeSeriesChart,
  generateDailyData,
  generateHourlyData,
} from "@/components/admin/analytics/time-series-chart";
import { VersionProgression } from "@/components/admin/analytics/version-progression";
import { authFetch } from "@/lib/client-api";

const FOCUS_REFRESH_COOLDOWN_MS = 10_000;

export default function AnalyticsPage() {
  const [stats, setStats] = useState<SiteAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const focusRefreshInFlightRef = useRef(false);
  const lastFocusRefreshAtRef = useRef(0);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await authFetch("/api/analytics");
      const data: SiteAnalytics = await res.json();
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch site analytics:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    const refreshOnFocus = () => {
      if (document.visibilityState !== "visible") {
        return;
      }

      const now = Date.now();
      if (
        focusRefreshInFlightRef.current ||
        now - lastFocusRefreshAtRef.current < FOCUS_REFRESH_COOLDOWN_MS
      ) {
        return;
      }

      focusRefreshInFlightRef.current = true;
      lastFocusRefreshAtRef.current = now;
      void fetchStats().finally(() => {
        focusRefreshInFlightRef.current = false;
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshOnFocus();
      }
    };

    window.addEventListener("focus", refreshOnFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", refreshOnFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchStats]);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <BarChart3 className="w-7 h-7 text-[hsl(var(--primary))]" />
            Site Analytics
          </h1>
          <p className="text-[hsl(var(--muted-foreground))] mt-1 ml-10">
            Track downloads, redirect clicks, and request metadata
          </p>
        </div>
        <button
          onClick={fetchStats}
          disabled={isLoading}
          className="px-4 py-2 bg-[hsl(var(--secondary))] rounded-lg hover:opacity-80 transition-opacity disabled:opacity-50 flex items-center gap-2"
        >
          <RefreshCw
            className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {isLoading && !stats ? (
        <div className="text-center py-12 text-[hsl(var(--muted-foreground))]">
          <div className="flex items-center justify-center gap-3">
            <LoaderCircle className="w-5 h-5 animate-spin text-[hsl(var(--primary))]" />
            <span>Loading analytics...</span>
          </div>
        </div>
      ) : !stats || !stats.byOs || !stats.bySource ? (
        <div className="text-center py-12">
          <p className="text-[hsl(var(--muted-foreground))]">
            No analytics data yet
          </p>
        </div>
      ) : (
        <AnalyticsContent stats={stats} />
      )}
    </div>
  );
}

function AnalyticsContent({ stats }: { stats: SiteAnalytics }) {
  const hourlyData = useMemo(
    () => generateHourlyData(stats.hourlyDownloads || stats.recent || []),
    [stats.hourlyDownloads, stats.recent]
  );
  const dailyData = useMemo(
    () => generateDailyData(stats.dailyDownloads || stats.recent || []),
    [stats.dailyDownloads, stats.recent]
  );
  const linkHourlyData = useMemo(
    () =>
      generateHourlyData(
        stats.hourlyLinkClicks || stats.recentLinkClicks || []
      ),
    [stats.hourlyLinkClicks, stats.recentLinkClicks]
  );
  const linkDailyData = useMemo(
    () =>
      generateDailyData(stats.dailyLinkClicks || stats.recentLinkClicks || []),
    [stats.dailyLinkClicks, stats.recentLinkClicks]
  );
  const byLinkSlug = stats.byLinkSlug || [];
  const linkCards = [
    {
      label: "Total Link Clicks",
      value: Number(stats.totalLinkClicks || 0).toLocaleString(),
      subtitle: "tracked redirect hits",
      icon: <Link2 className="w-5 h-5" />,
      color: "text-amber-400",
      bgGlow: "bg-amber-500/10",
    },
    {
      label: "Top Link Path",
      value: byLinkSlug[0]?.slug ? `/l/${byLinkSlug[0].slug}` : "N/A",
      subtitle: byLinkSlug[0]?.count
        ? `${Number(byLinkSlug[0].count).toLocaleString()} clicks`
        : "no clicks yet",
      icon: <ArrowRight className="w-5 h-5" />,
      color: "text-rose-400",
      bgGlow: "bg-rose-500/10",
    },
    {
      label: "Unique Paths",
      value: byLinkSlug.length.toString(),
      subtitle: "configured aliases clicked",
      icon: <Grid2x2 className="w-5 h-5" />,
      color: "text-cyan-400",
      bgGlow: "bg-cyan-500/10",
    },
  ];

  return (
    <div className="space-y-8">
      <section className="animate-fade-in">
        <StatsCards stats={stats} />
      </section>

      <section className="animate-fade-in" style={{ animationDelay: "100ms" }}>
        <div className="flex items-center gap-2 mb-4">
          <Clock3 className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-semibold">Download Trends</h2>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <TimeSeriesChart
            title="Last 48 Hours"
            subtitle="Downloads per hour"
            data={hourlyData}
            color="bg-cyan-500"
            accentColor="text-cyan-400"
            metricLabel="downloads"
          />
          <TimeSeriesChart
            title="Last 30 Days"
            subtitle="Downloads per day"
            data={dailyData}
            color="bg-violet-500"
            accentColor="text-violet-400"
            metricLabel="downloads"
          />
        </div>
      </section>

      <section className="animate-fade-in" style={{ animationDelay: "200ms" }}>
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-semibold">Download Breakdown</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DownloadChart
            title="Downloads by OS"
            data={(stats.byOs || []).map((item) => ({
              label: item.os,
              count: item.count,
            }))}
            total={stats.totalDownloads || 0}
            color="bg-blue-500"
          />
          <DownloadChart
            title="Downloads by Source"
            data={(stats.bySource || []).map((item) => ({
              label: item.source,
              count: item.count,
            }))}
            total={stats.totalDownloads || 0}
            color="bg-green-500"
          />
        </div>
      </section>

      <section className="animate-fade-in" style={{ animationDelay: "230ms" }}>
        <div className="flex items-center gap-2 mb-4">
          <Link2 className="w-5 h-5 text-amber-400" />
          <h2 className="text-lg font-semibold">Link Redirects</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {linkCards.map((card, index) => (
            <MetricCard
              key={card.label}
              label={card.label}
              value={card.value}
              subtitle={card.subtitle}
              icon={card.icon}
              color={card.color}
              bgGlow={card.bgGlow}
              animationDelayMs={index * 40}
            />
          ))}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <DownloadChart
            title="Clicks by Link Path"
            data={byLinkSlug.map((item) => ({
              label: `/l/${item.slug}`,
              count: item.count,
            }))}
            total={stats.totalLinkClicks || 0}
            color="bg-amber-500"
          />
          <TimeSeriesChart
            title="Last 48 Hours"
            subtitle="Redirect clicks per hour"
            data={linkHourlyData}
            color="bg-amber-500"
            accentColor="text-amber-400"
            metricLabel="clicks"
          />
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
          <TimeSeriesChart
            title="Last 30 Days"
            subtitle="Redirect clicks per day"
            data={linkDailyData}
            color="bg-rose-500"
            accentColor="text-rose-400"
            metricLabel="clicks"
          />
          <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-6">
            <h3 className="text-lg font-semibold mb-4">
              Tracked Redirect Paths
            </h3>
            <div className="space-y-3">
              {byLinkSlug.length > 0 ? (
                byLinkSlug.map((item, index) => (
                  <div
                    key={item.slug}
                    className="flex items-center justify-between rounded-lg bg-[hsl(var(--secondary))] px-4 py-3 animate-slide-up"
                    style={{ animationDelay: `${index * 40}ms` }}
                  >
                    <span className="font-medium">/l/{item.slug}</span>
                    <span className="text-sm text-[hsl(var(--muted-foreground))]">
                      {Number(item.count).toLocaleString()} clicks
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  Redirects are configured, but no clicks have been recorded yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="animate-fade-in" style={{ animationDelay: "260ms" }}>
        {stats.r2VersionHistory ? (
          <VersionProgression history={stats.r2VersionHistory} />
        ) : stats.r2VersionHistoryError ? (
          <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-6">
            <h3 className="text-lg font-semibold mb-2">
              Version History Progression
            </h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Cloudflare R2 analytics unavailable: {stats.r2VersionHistoryError}
            </p>
          </div>
        ) : null}
      </section>

      <section className="animate-fade-in" style={{ animationDelay: "300ms" }}>
        <div className="flex items-center gap-2 mb-4">
          <CalendarDays className="w-5 h-5 text-emerald-400" />
          <h2 className="text-lg font-semibold">Recent Activity</h2>
        </div>
        <RecentDownloads downloads={stats.recent || []} />
        <div className="mt-6">
          <RecentLinkClicks clicks={stats.recentLinkClicks || []} />
        </div>
      </section>
    </div>
  );
}
