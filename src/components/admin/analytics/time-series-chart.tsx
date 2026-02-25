"use client";

import { useState } from "react";
import type { DownloadSeriesPoint } from "@/lib/types/feedback";

interface TimeSeriesDataPoint {
  label: string;
  count: number;
  fullLabel: string;
}

interface TimeSeriesChartProps {
  title: string;
  subtitle: string;
  data: TimeSeriesDataPoint[];
  color: string;
  accentColor: string;
}

export function TimeSeriesChart({ title, subtitle, data, color, accentColor }: TimeSeriesChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const maxCount = Math.max(...data.map(d => d.count), 1);
  const totalCount = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <ChartIcon className={`w-5 h-5 ${accentColor}`} />
            {title}
          </h3>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">{subtitle}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">{totalCount.toLocaleString()}</div>
          <div className="text-xs text-[hsl(var(--muted-foreground))]">total downloads</div>
        </div>
      </div>

      {/* Chart */}
      <div className="relative h-48 mt-6">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-6 w-10 flex flex-col justify-between text-xs text-[hsl(var(--muted-foreground))]">
          <span>{maxCount}</span>
          <span>{Math.round(maxCount / 2)}</span>
          <span>0</span>
        </div>

        {/* Bars container */}
        <div className="ml-12 h-full flex items-end gap-[2px] pb-6">
          {data.map((point, index) => {
            const height = maxCount > 0 ? (point.count / maxCount) * 100 : 0;
            const isHovered = hoveredIndex === index;

            return (
              <div
                key={index}
                className="relative flex-1 flex flex-col items-center justify-end h-full group"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Tooltip */}
                {isHovered && (
                  <div className="absolute bottom-full mb-2 z-20 animate-fade-in">
                    <div className="bg-[hsl(var(--popover))] border border-[hsl(var(--border))] rounded-lg shadow-xl shadow-black/30 px-3 py-2 text-sm whitespace-nowrap">
                      <div className="font-semibold">{point.count.toLocaleString()} downloads</div>
                      <div className="text-xs text-[hsl(var(--muted-foreground))]">{point.fullLabel}</div>
                    </div>
                    <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 bg-[hsl(var(--popover))] border-r border-b border-[hsl(var(--border))] rotate-45" />
                  </div>
                )}

                {/* Bar */}
                <div
                  className={`w-full rounded-t transition-all duration-200 cursor-pointer ${color} ${
                    isHovered ? "opacity-100 scale-x-110" : "opacity-70 hover:opacity-90"
                  }`}
                  style={{
                    height: `${Math.max(height, 2)}%`,
                    animationDelay: `${index * 10}ms`,
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* X-axis line */}
        <div className="absolute bottom-6 left-12 right-0 h-px bg-[hsl(var(--border))]" />

        {/* X-axis labels - show a few evenly spaced */}
        <div className="absolute bottom-0 left-12 right-0 flex justify-between text-xs text-[hsl(var(--muted-foreground))]">
          {data.length > 0 && (
            <>
              <span>{data[0]?.label}</span>
              <span>{data[Math.floor(data.length / 2)]?.label}</span>
              <span>{data[data.length - 1]?.label}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function parseTimestamp(raw: string | undefined): Date | null {
  if (!raw) {
    return null;
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  // SQLite timestamps are stored without timezone. Treat them as UTC.
  const isoLike = trimmed.includes("T")
    ? trimmed
    : trimmed.includes(" ")
      ? trimmed.replace(" ", "T")
      : `${trimmed}T00:00:00`;
  const withZone = /(?:Z|[+\-]\d{2}:?\d{2})$/.test(isoLike) ? isoLike : `${isoLike}Z`;
  const parsed = new Date(withZone);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function bucketKeyByHour(date: Date): number {
  return Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
    0,
    0,
    0
  );
}

function bucketKeyByDay(date: Date): number {
  return Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    0,
    0,
    0,
    0
  );
}

function toCount(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    return 0;
  }
  return Math.max(0, Math.trunc(parsed));
}

function hasAggregatedBuckets(points: DownloadSeriesPoint[]): boolean {
  return points.some((point) => typeof point.bucket_start === "string" && point.bucket_start.length > 0);
}

// Utility function to generate hourly data for last 48 hours
export function generateHourlyData(downloads: DownloadSeriesPoint[]): TimeSeriesDataPoint[] {
  if (hasAggregatedBuckets(downloads)) {
    return downloads
      .map((point) => {
        const bucketDate = parseTimestamp(point.bucket_start);
        if (!bucketDate) {
          return null;
        }

        return {
          label: bucketDate.toLocaleTimeString("en-US", { hour: "numeric", hour12: true }),
          count: toCount(point.count),
          fullLabel: bucketDate.toLocaleString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "numeric",
            hour12: true,
          }),
          bucketMs: bucketDate.getTime(),
        };
      })
      .filter((point): point is TimeSeriesDataPoint & { bucketMs: number } => point !== null)
      .sort((a, b) => a.bucketMs - b.bucketMs)
      .map(({ label, count, fullLabel }) => ({ label, count, fullLabel }));
  }

  const hourlyCounts = new Map<number, number>();
  for (const download of downloads) {
    const createdAt = parseTimestamp(download.created_at);
    if (!createdAt) {
      continue;
    }

    const key = bucketKeyByHour(createdAt);
    hourlyCounts.set(key, (hourlyCounts.get(key) ?? 0) + 1);
  }

  const now = new Date();
  const currentHourUtc = bucketKeyByHour(now);
  const data: TimeSeriesDataPoint[] = [];

  for (let i = 47; i >= 0; i--) {
    const bucketUtcMs = currentHourUtc - (i * 60 * 60 * 1000);
    const hourStart = new Date(bucketUtcMs);
    const count = hourlyCounts.get(bucketUtcMs) ?? 0;

    const label = hourStart.toLocaleTimeString("en-US", { hour: "numeric", hour12: true });
    const fullLabel = hourStart.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      hour12: true,
    });

    data.push({ label, count, fullLabel });
  }

  return data;
}

// Utility function to generate daily data for last 30 days
export function generateDailyData(downloads: DownloadSeriesPoint[]): TimeSeriesDataPoint[] {
  if (hasAggregatedBuckets(downloads)) {
    return downloads
      .map((point) => {
        const bucketDate = parseTimestamp(point.bucket_start);
        if (!bucketDate) {
          return null;
        }

        return {
          label: bucketDate.toLocaleDateString("en-US", { day: "numeric" }),
          count: toCount(point.count),
          fullLabel: bucketDate.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          }),
          bucketMs: bucketDate.getTime(),
        };
      })
      .filter((point): point is TimeSeriesDataPoint & { bucketMs: number } => point !== null)
      .sort((a, b) => a.bucketMs - b.bucketMs)
      .map(({ label, count, fullLabel }) => ({ label, count, fullLabel }));
  }

  const dailyCounts = new Map<number, number>();
  for (const download of downloads) {
    const createdAt = parseTimestamp(download.created_at);
    if (!createdAt) {
      continue;
    }

    const key = bucketKeyByDay(createdAt);
    dailyCounts.set(key, (dailyCounts.get(key) ?? 0) + 1);
  }

  const now = new Date();
  const todayUtc = bucketKeyByDay(now);
  const data: TimeSeriesDataPoint[] = [];

  for (let i = 29; i >= 0; i--) {
    const bucketUtcMs = todayUtc - (i * 24 * 60 * 60 * 1000);
    const dayStart = new Date(bucketUtcMs);
    const count = dailyCounts.get(bucketUtcMs) ?? 0;

    const label = dayStart.toLocaleDateString("en-US", { day: "numeric" });
    const fullLabel = dayStart.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    data.push({ label, count, fullLabel });
  }

  return data;
}
