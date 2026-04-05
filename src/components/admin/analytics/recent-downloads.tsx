"use client";

import { Globe2, List, Monitor, MousePointerClick } from "lucide-react";
import type { DownloadItem } from "@/lib/types/feedback";
import {
  ActivityDetailItem,
  ActivityMasterDetail,
  formatAnalyticsDate,
} from "@/components/admin/analytics/activity-master-detail";

interface RecentDownloadsProps {
  downloads: DownloadItem[];
}

export function RecentDownloads({ downloads }: RecentDownloadsProps) {
  return (
    <ActivityMasterDetail
      items={downloads}
      title="Recent Downloads"
      detailTitle="Download Details"
      emptyMessage="No download data yet"
      placeholderText="Select a download to view details"
      listIcon={<List className="w-5 h-5 text-[hsl(var(--muted-foreground))]" />}
      placeholderIcon={
        <MousePointerClick className="w-6 h-6 text-[hsl(var(--muted-foreground))]" />
      }
      getItemKey={(item) => item.id}
      getItemTimestamp={(item) => item.created_at}
      detailTimestampLabel="Downloaded"
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
              <Globe2 className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium">
                {item.os || "Unknown OS"} • {item.browser || "Unknown Browser"}
              </span>
              <span className="text-xs text-[hsl(var(--muted-foreground))]">
                {item.city !== "unknown" ? `${item.city}, ` : ""}
                {item.country !== "unknown" ? item.country : "Unknown location"}
              </span>
            </div>
          </div>
          <div className="hidden xl:flex items-center gap-4 text-xs text-[hsl(var(--muted-foreground))] shrink-0">
            {item.screen_resolution ? (
              <span className="flex items-center gap-1">
                <Monitor className="w-3 h-3" />
                {item.screen_resolution}
              </span>
            ) : null}
            {item.language ? (
              <span className="uppercase">{item.language}</span>
            ) : null}
            {item.ip && item.ip !== "unknown" ? (
              <span className="font-mono text-[10px]">{item.ip}</span>
            ) : null}
          </div>
          <div className="text-right shrink-0">
            <span className="text-xs px-2 py-1 bg-[hsl(var(--card))] rounded border border-[hsl(var(--border))]">
              {item.source || "direct"}
            </span>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
              {formatAnalyticsDate(item.created_at)}
            </p>
          </div>
        </div>
      )}
      renderDetailContent={(selectedDownload) => (
        <div className="grid grid-cols-2 gap-4 text-sm">
          <ActivityDetailItem
            label="OS"
            value={`${selectedDownload.os || "Unknown"} ${selectedDownload.os_version || ""}`}
          />
          <ActivityDetailItem
            label="Browser"
            value={`${selectedDownload.browser || "Unknown"} ${selectedDownload.browser_version || ""}`}
          />
          <ActivityDetailItem
            label="Architecture"
            value={selectedDownload.architecture || "Unknown"}
          />
          <ActivityDetailItem
            label="Platform"
            value={selectedDownload.platform || "Unknown"}
          />
          <ActivityDetailItem
            label="Language"
            value={selectedDownload.language || "Unknown"}
          />
          <ActivityDetailItem
            label="Screen"
            value={selectedDownload.screen_resolution || "Unknown"}
          />
          <ActivityDetailItem
            label="Timezone"
            value={selectedDownload.timezone || "Unknown"}
          />
          <ActivityDetailItem
            label="Source"
            value={selectedDownload.source || "Direct"}
          />
          <ActivityDetailItem
            label="Location"
            value={`${selectedDownload.city !== "unknown" ? selectedDownload.city : ""}${selectedDownload.region !== "unknown" ? `, ${selectedDownload.region}` : ""}${selectedDownload.country !== "unknown" ? `, ${selectedDownload.country}` : "Unknown"}`}
            fullWidth
          />
          {selectedDownload.referrer ? (
            <ActivityDetailItem
              label="Referrer"
              value={selectedDownload.referrer}
              fullWidth
              truncate
            />
          ) : null}
          <ActivityDetailItem
            label="IP Address"
            value={selectedDownload.ip || "Unknown"}
            fullWidth
          />
        </div>
      )}
    />
  );
}
