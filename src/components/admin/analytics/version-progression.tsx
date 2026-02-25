"use client";

import { useMemo, useState } from "react";
import type {
  R2VersionHistory,
  R2VersionHistoryPoint,
} from "@/lib/types/feedback";

interface VersionProgressionProps {
  history: R2VersionHistory;
}

interface StackedSeries {
  key: string;
  label: string;
  objectName: string | null;
  colorClass: string;
  totalRequests: number;
  totalResponseBytes: number;
  daily: R2VersionHistoryPoint[];
}

const VERSION_COLORS = [
  "bg-cyan-500",
  "bg-violet-500",
  "bg-emerald-500",
  "bg-blue-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-lime-500",
  "bg-sky-500",
  "bg-fuchsia-500",
  "bg-teal-500",
  "bg-orange-500",
  "bg-indigo-500",
];

function formatCompactDate(date: string): string {
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) {
    return date;
  }
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatCount(value: number): string {
  return value.toLocaleString("en-US");
}

function formatBytes(value: number): string {
  if (value <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = value;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  const precision = size >= 100 ? 0 : size >= 10 ? 1 : 2;
  return `${size.toFixed(precision)} ${units[unitIndex]}`;
}

function parseVersionParts(version: string): number[] {
  const match = version.match(/\d+(?:\.\d+)*/);
  if (!match) {
    return [];
  }

  return match[0]
    .split(".")
    .map((part) => Number(part))
    .filter((part) => Number.isFinite(part));
}

function compareSemanticVersionsAsc(leftVersion: string, rightVersion: string): number {
  const leftParts = parseVersionParts(leftVersion);
  const rightParts = parseVersionParts(rightVersion);

  if (leftParts.length === 0 && rightParts.length === 0) {
    return leftVersion.localeCompare(rightVersion);
  }
  if (leftParts.length === 0) {
    return -1;
  }
  if (rightParts.length === 0) {
    return 1;
  }

  const maxLength = Math.max(leftParts.length, rightParts.length);
  for (let index = 0; index < maxLength; index += 1) {
    const leftValue = leftParts[index] ?? 0;
    const rightValue = rightParts[index] ?? 0;
    if (leftValue !== rightValue) {
      return leftValue - rightValue;
    }
  }

  return leftVersion.localeCompare(rightVersion);
}

function getStackedSeries(history: R2VersionHistory): StackedSeries[] {
  return [...history.versions]
    .sort((left, right) => {
      const versionOrder = compareSemanticVersionsAsc(left.version, right.version);
      if (versionOrder !== 0) {
        return versionOrder;
      }
      return left.totalRequests - right.totalRequests;
    })
    .map((version, index) => ({
      key: version.objectName,
      label: `v${version.version}`,
      objectName: version.objectName,
      colorClass: VERSION_COLORS[index % VERSION_COLORS.length],
      totalRequests: version.totalRequests,
      totalResponseBytes: version.totalResponseBytes,
      daily: version.daily,
    }));
}

function getTooltipColorClass(
  objectName: string,
  stackedSeries: StackedSeries[],
  fallbackIndex: number
): string {
  const matched = stackedSeries.find((entry) => entry.objectName === objectName);
  if (matched) {
    return matched.colorClass;
  }
  return VERSION_COLORS[fallbackIndex % VERSION_COLORS.length] ?? VERSION_COLORS[0];
}

export function VersionProgression({ history }: VersionProgressionProps) {
  const stackedSeries = getStackedSeries(history);
  const sortedVersions = useMemo(
    () =>
      [...history.versions].sort((left, right) => {
        const versionOrder = compareSemanticVersionsAsc(left.version, right.version);
        if (versionOrder !== 0) {
          return versionOrder;
        }
        return left.totalRequests - right.totalRequests;
      }),
    [history.versions]
  );
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hoveredX, setHoveredX] = useState<number>(0);
  const maxDailyRequests = Math.max(
    1,
    ...history.dailyTotals.map((point) => point.requests)
  );
  const middleIndex = Math.floor((history.dailyTotals.length - 1) / 2);

  const hoveredDay = hoveredIndex !== null ? history.dailyTotals[hoveredIndex] : null;
  const hoveredBreakdown = useMemo(() => {
    if (hoveredIndex === null) {
      return [];
    }

    return sortedVersions
      .map((version, index) => {
        const dailyPoint = version.daily[hoveredIndex];
        const requests = dailyPoint?.requests ?? 0;
        const responseBytes = dailyPoint?.responseBytes ?? 0;
        return {
          key: version.objectName,
          label: `v${version.version}`,
          version: version.version,
          objectName: version.objectName,
          requests,
          responseBytes,
          colorClass: getTooltipColorClass(version.objectName, stackedSeries, index),
        };
      })
      .filter((item) => item.requests > 0)
      .sort((left, right) => compareSemanticVersionsAsc(left.version, right.version));
  }, [hoveredIndex, sortedVersions, stackedSeries]);

  if (history.versions.length === 0) {
    return (
      <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-6">
        <h3 className="text-lg font-semibold mb-2">Version History Progression</h3>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          No Cloudflare R2 download data for {history.rangeStart} to {history.rangeEnd}.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-6 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Version History Progression</h3>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
            Cloudflare R2 • {history.bucket} • {history.metric}
          </p>
        </div>
        <p className="text-xs text-[hsl(var(--muted-foreground))]">
          {formatCompactDate(history.rangeStart)} - {formatCompactDate(history.rangeEnd)}
        </p>
      </div>

      <div className="rounded-lg border border-[hsl(var(--border))] p-4 bg-[hsl(var(--secondary))]/30 space-y-4">
        <div className="relative">
          {hoveredDay ? (
            <div
              className="absolute z-20 pointer-events-none -translate-x-1/2 -translate-y-[calc(100%+12px)] rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 shadow-lg min-w-[220px] max-w-[320px]"
              style={{ left: `${hoveredX}%`, top: 0 }}
            >
              <div className="text-xs font-medium">
                {formatCompactDate(hoveredDay.date)}: {formatCount(hoveredDay.requests)} requests
              </div>
              <div className="text-[11px] text-[hsl(var(--muted-foreground))] mt-0.5">
                {formatBytes(hoveredDay.responseBytes)} transferred
              </div>
              <div className="mt-2 space-y-1 max-h-44 overflow-y-auto pr-1">
                {hoveredBreakdown.length > 0 ? (
                  hoveredBreakdown.map((item) => (
                    <div key={`${item.key}-${hoveredDay.date}`} className="flex items-center justify-between gap-3 text-[11px]">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`inline-block h-2 w-2 rounded-full ${item.colorClass}`} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      <div className="text-[hsl(var(--muted-foreground))] whitespace-nowrap">
                        {formatCount(item.requests)} • {formatBytes(item.responseBytes)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-[11px] text-[hsl(var(--muted-foreground))]">No downloads on this day</div>
                )}
              </div>
            </div>
          ) : null}

          <div
            className="h-56 w-full flex items-end gap-1"
            onMouseLeave={() => setHoveredIndex(null)}
          >
          {history.dailyTotals.map((day, index) => {
            const totalRequests = day.requests;
            const heightPercent = totalRequests === 0
              ? 4
              : Math.max(6, Math.round((totalRequests / maxDailyRequests) * 100));

            return (
              <div key={`stack-${day.date}`} className="flex-1 h-full flex items-end">
                <div
                  className="w-full rounded-sm overflow-hidden bg-[hsl(var(--muted))]/20 hover:opacity-95 transition-opacity"
                  style={{ height: `${heightPercent}%` }}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseMove={(event) => {
                    const bounds = event.currentTarget.parentElement?.parentElement?.getBoundingClientRect();
                    if (!bounds) {
                      return;
                    }
                    const relative = ((event.clientX - bounds.left) / bounds.width) * 100;
                    setHoveredX(Math.min(95, Math.max(5, relative)));
                    setHoveredIndex(index);
                  }}
                >
                  <div className="h-full w-full flex flex-col-reverse">
                    {stackedSeries.map((series) => {
                      const segmentRequests = series.daily[index]?.requests ?? 0;
                      if (totalRequests <= 0 || segmentRequests <= 0) {
                        return null;
                      }
                      return (
                        <div
                          key={`${series.key}-${day.date}`}
                          className={series.colorClass}
                          style={{ height: `${(segmentRequests / totalRequests) * 100}%` }}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-[hsl(var(--muted-foreground))]">
          <span>{formatCompactDate(history.rangeStart)}</span>
          {history.dailyTotals.length > 2 ? (
            <span>{formatCompactDate(history.dailyTotals[middleIndex]?.date ?? history.rangeStart)}</span>
          ) : null}
          <span>{formatCompactDate(history.rangeEnd)}</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {stackedSeries.map((series) => (
            <div
              key={`legend-${series.key}`}
              className="inline-flex items-center gap-2 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))]/50 px-2.5 py-1 text-xs"
              title={series.objectName ?? undefined}
            >
              <span className={`inline-block h-2.5 w-2.5 rounded-full ${series.colorClass}`} />
              <span className="font-medium">{series.label}</span>
              <span className="text-[hsl(var(--muted-foreground))]">
                {formatCount(series.totalRequests)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium mb-3">Release Totals</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]">
                <th className="text-left py-2 pr-4">Version</th>
                <th className="text-right py-2 pr-4">Requests</th>
                <th className="text-right py-2">Transferred</th>
              </tr>
            </thead>
            <tbody>
              {[...history.versions]
                .sort((left, right) => {
                  const versionOrder = compareSemanticVersionsAsc(left.version, right.version);
                  if (versionOrder !== 0) {
                    return versionOrder;
                  }
                  return left.totalRequests - right.totalRequests;
                })
                .map((version) => (
                  <tr key={`row-${version.objectName}`} className="border-b border-[hsl(var(--border))]/40">
                    <td className="py-2 pr-4">
                      <span className="font-medium">v{version.version}</span>
                    </td>
                    <td className="py-2 pr-4 text-right">{formatCount(version.totalRequests)}</td>
                    <td className="py-2 text-right">{formatBytes(version.totalResponseBytes)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
