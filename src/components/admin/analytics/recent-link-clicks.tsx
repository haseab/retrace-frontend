"use client";

import { ArrowRight, Link2 } from "lucide-react";
import type { LinkClickItem } from "@/lib/types/feedback";
import {
  ActivityDetailItem,
  ActivityMasterDetail,
  formatAnalyticsDate,
} from "@/components/admin/analytics/activity-master-detail";

interface RecentLinkClicksProps {
  clicks: LinkClickItem[];
}

export function RecentLinkClicks({ clicks }: RecentLinkClicksProps) {
  return (
    <ActivityMasterDetail
      items={clicks}
      title="Recent Link Clicks"
      detailTitle="Link Click Details"
      emptyMessage="No link click data yet"
      placeholderText="Select a link click to view details"
      listIcon={<Link2 className="w-5 h-5 text-[hsl(var(--muted-foreground))]" />}
      getItemKey={(item) => item.id}
      getItemTimestamp={(item) => item.created_at}
      detailTimestampLabel="Clicked"
      renderListItem={(item, selected) => (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`p-2 rounded-lg transition-all duration-200 shrink-0 ${
                selected
                  ? "bg-[hsl(var(--primary))]/30"
                  : "bg-[hsl(var(--card))]"
              }`}
            >
              <ArrowRight className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium truncate">/l/{item.slug}</span>
              <span className="text-xs text-[hsl(var(--muted-foreground))] truncate">
                {item.city !== "unknown" ? `${item.city}, ` : ""}
                {item.country !== "unknown"
                  ? item.country
                  : item.request_host || "Unknown host"}
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-xs px-2 py-1 bg-[hsl(var(--card))] rounded border border-[hsl(var(--border))]">
              {item.request_host || "retrace.to"}
            </span>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
              {formatAnalyticsDate(item.created_at)}
            </p>
          </div>
        </div>
      )}
      renderDetailContent={(selectedClick) => (
        <div className="grid grid-cols-2 gap-4 text-sm">
          <ActivityDetailItem label="Path" value={`/l/${selectedClick.slug}`} />
          <ActivityDetailItem
            label="Host"
            value={selectedClick.request_host || "Unknown"}
          />
          <ActivityDetailItem
            label="Location"
            value={`${selectedClick.city !== "unknown" ? selectedClick.city : ""}${selectedClick.region !== "unknown" ? `, ${selectedClick.region}` : ""}${selectedClick.country !== "unknown" ? `, ${selectedClick.country}` : "Unknown"}`}
            fullWidth
          />
          <ActivityDetailItem
            label="IP Address"
            value={selectedClick.ip || "Unknown"}
          />
          <ActivityDetailItem
            label="Language"
            value={selectedClick.accept_language || "Unknown"}
          />
          <ActivityDetailItem
            label="Destination"
            value={selectedClick.destination || "Unknown"}
            fullWidth
            truncate
          />
          {selectedClick.referrer ? (
            <ActivityDetailItem
              label="Referrer"
              value={selectedClick.referrer}
              fullWidth
              truncate
            />
          ) : null}
          {selectedClick.query_string ? (
            <ActivityDetailItem
              label="Query String"
              value={selectedClick.query_string}
              fullWidth
              truncate
            />
          ) : null}
          {selectedClick.user_agent ? (
            <ActivityDetailItem
              label="User Agent"
              value={selectedClick.user_agent}
              fullWidth
              truncate
            />
          ) : null}
        </div>
      )}
    />
  );
}
