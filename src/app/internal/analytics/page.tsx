"use client";

import { useState, useEffect, useMemo } from "react";
import { DownloadStats } from "@/lib/types/feedback";
import { StatsCards } from "@/components/admin/analytics/stats-cards";
import { DownloadChart } from "@/components/admin/analytics/download-chart";
import { RecentDownloads } from "@/components/admin/analytics/recent-downloads";
import { TimeSeriesChart, generateHourlyData, generateDailyData } from "@/components/admin/analytics/time-series-chart";
import { VersionProgression } from "@/components/admin/analytics/version-progression";
import { authFetch } from "@/lib/client-api";

export default function AnalyticsPage() {
  const [stats, setStats] = useState<DownloadStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const res = await authFetch("/api/analytics");
      const data: DownloadStats = await res.json();
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch download stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <BarChartIcon className="w-7 h-7 text-[hsl(var(--primary))]" />
            Download Analytics
          </h1>
          <p className="text-[hsl(var(--muted-foreground))] mt-1 ml-10">
            Track download metrics and user demographics
          </p>
        </div>
        <button
          onClick={fetchStats}
          disabled={isLoading}
          className="px-4 py-2 bg-[hsl(var(--secondary))] rounded-lg hover:opacity-80 transition-opacity disabled:opacity-50 flex items-center gap-2"
        >
          <RefreshIcon className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Content */}
      {isLoading && !stats ? (
        <div className="text-center py-12 text-[hsl(var(--muted-foreground))]">
          <LoadingSpinner />
        </div>
      ) : !stats || !stats.byOs || !stats.bySource ? (
        <div className="text-center py-12">
          <p className="text-[hsl(var(--muted-foreground))]">No download data yet</p>
        </div>
      ) : (
        <AnalyticsContent stats={stats} />
      )}
    </div>
  );
}

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}

function BarChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <line x1="12" y1="20" x2="12" y2="10" />
      <line x1="18" y1="20" x2="18" y2="4" />
      <line x1="6" y1="20" x2="6" y2="16" />
    </svg>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center gap-3">
      <div className="w-5 h-5 border-2 border-[hsl(var(--primary))] border-t-transparent rounded-full animate-spin" />
      <span>Loading analytics...</span>
    </div>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function AnalyticsContent({ stats }: { stats: DownloadStats }) {
  // Use dedicated hourly/daily data if available, fallback to recent for backwards compatibility
  const hourlyData = useMemo(() => generateHourlyData(stats.hourlyDownloads || stats.recent || []), [stats.hourlyDownloads, stats.recent]);
  const dailyData = useMemo(() => generateDailyData(stats.dailyDownloads || stats.recent || []), [stats.dailyDownloads, stats.recent]);

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <section className="animate-fade-in">
        <StatsCards stats={stats} />
      </section>

      {/* Time Series Charts Section */}
      <section className="animate-fade-in" style={{ animationDelay: "100ms" }}>
        <div className="flex items-center gap-2 mb-4">
          <ClockIcon className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-semibold">Download Trends</h2>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <TimeSeriesChart
            title="Last 48 Hours"
            subtitle="Downloads per hour"
            data={hourlyData}
            color="bg-cyan-500"
            accentColor="text-cyan-400"
          />
          <TimeSeriesChart
            title="Last 30 Days"
            subtitle="Downloads per day"
            data={dailyData}
            color="bg-violet-500"
            accentColor="text-violet-400"
          />
        </div>
      </section>

      {/* Breakdown Charts Section */}
      <section className="animate-fade-in" style={{ animationDelay: "200ms" }}>
        <div className="flex items-center gap-2 mb-4">
          <BarChartIcon className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-semibold">Download Breakdown</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DownloadChart
            title="Downloads by OS"
            data={(stats.byOs || []).map((item) => ({ label: item.os, count: item.count }))}
            total={stats.totalDownloads || 0}
            color="bg-blue-500"
          />
          <DownloadChart
            title="Downloads by Source"
            data={(stats.bySource || []).map((item) => ({ label: item.source, count: item.count }))}
            total={stats.totalDownloads || 0}
            color="bg-green-500"
          />
        </div>
      </section>

      {/* Version Progression Section */}
      <section className="animate-fade-in" style={{ animationDelay: "260ms" }}>
        {stats.r2VersionHistory ? (
          <VersionProgression history={stats.r2VersionHistory} />
        ) : stats.r2VersionHistoryError ? (
          <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-6">
            <h3 className="text-lg font-semibold mb-2">Version History Progression</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Cloudflare R2 analytics unavailable: {stats.r2VersionHistoryError}
            </p>
          </div>
        ) : null}
      </section>

      {/* Recent Downloads Section */}
      <section className="animate-fade-in" style={{ animationDelay: "300ms" }}>
        <div className="flex items-center gap-2 mb-4">
          <CalendarIcon className="w-5 h-5 text-emerald-400" />
          <h2 className="text-lg font-semibold">Recent Activity</h2>
        </div>
        <RecentDownloads downloads={stats.recent || []} />
      </section>
    </div>
  );
}
