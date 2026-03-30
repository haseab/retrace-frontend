"use client";

import { useState } from "react";
import type { DiagnosticMetricEvent } from "@/lib/types/feedback";

interface RecentMetricEventsSectionProps {
  events: DiagnosticMetricEvent[];
  formatDate: (dateString: string) => string;
}

const INITIAL_VISIBLE_EVENT_COUNT = 12;

export function RecentMetricEventsSection({
  events,
  formatDate,
}: RecentMetricEventsSectionProps) {
  const [expanded, setExpanded] = useState(false);

  if (events.length === 0) {
    return null;
  }

  const visibleEvents = expanded
    ? events
    : events.slice(0, INITIAL_VISIBLE_EVENT_COUNT);

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <h3 className="text-xs font-medium text-sky-300">
          Recent Actions ({events.length})
        </h3>
        {events.length > INITIAL_VISIBLE_EVENT_COUNT && (
          <button
            onClick={() => setExpanded((current) => !current)}
            className="text-[10px] text-[hsl(var(--primary))] hover:underline"
          >
            {expanded ? "Show less" : "Show all"}
          </button>
        )}
      </div>
      <div
        className={`space-y-2 overflow-y-auto pr-1 ${
          expanded ? "max-h-[400px]" : "max-h-48"
        }`}
      >
        {visibleEvents.map((event) => {
          const detailEntries = Object.entries(event.details);

          return (
            <div
              key={`${event.timestamp}-${event.metricType}-${event.summary}`}
              className="bg-sky-500/10 border border-sky-500/20 rounded-lg px-2.5 py-2"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-sky-100">{event.summary}</div>
                  <div className="text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5">
                    {formatDate(event.timestamp)} • {event.metricType}
                  </div>
                </div>
              </div>
              {detailEntries.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {detailEntries.map(([key, value]) => (
                    <span
                      key={`${event.metricType}-${key}`}
                      className="px-1.5 py-0.5 text-[10px] rounded border bg-sky-500/15 text-sky-200 border-sky-500/25"
                    >
                      {key}: {value}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {!expanded && events.length > INITIAL_VISIBLE_EVENT_COUNT && (
        <p className="mt-2 text-[10px] text-[hsl(var(--muted-foreground))]">
          ... and {events.length - INITIAL_VISIBLE_EVENT_COUNT} more action(s)
        </p>
      )}
    </div>
  );
}
