"use client";

import { useState } from "react";
import { DownloadItem } from "@/lib/types/feedback";

interface RecentDownloadsProps {
  downloads: DownloadItem[];
}

export function RecentDownloads({ downloads }: RecentDownloadsProps) {
  const [selectedDownload, setSelectedDownload] = useState<DownloadItem | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleSelect = (item: DownloadItem) => {
    if (selectedDownload?.id === item.id) {
      setSelectedDownload(null);
    } else {
      setSelectedDownload(item);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-6 transition-all duration-300 hover:shadow-lg hover:shadow-black/10">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <ListIcon className="w-5 h-5 text-[hsl(var(--muted-foreground))]" />
          Recent Downloads
        </h3>
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
          {downloads.map((item, index) => (
            <div
              key={item.id}
              onClick={() => handleSelect(item)}
              className={`p-3 rounded-lg cursor-pointer transition-all duration-200 animate-slide-up hover:-translate-y-0.5 ${
                selectedDownload?.id === item.id
                  ? "bg-[hsl(var(--primary))]/20 border border-[hsl(var(--primary))] shadow-md shadow-[hsl(var(--primary))]/10"
                  : "bg-[hsl(var(--secondary))] border border-transparent hover:bg-[hsl(var(--secondary))]/80 hover:border-[hsl(var(--border))] hover:shadow-md hover:shadow-black/10"
              }`}
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2 rounded-lg transition-all duration-200 shrink-0 ${
                    selectedDownload?.id === item.id
                      ? "bg-[hsl(var(--primary))]/30"
                      : "bg-[hsl(var(--card))]"
                  }`}>
                    <GlobeIcon className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium">
                      {item.os || "Unknown OS"} • {item.browser || "Unknown Browser"}
                    </span>
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">
                      {item.city !== "unknown" ? `${item.city}, ` : ""}{item.country !== "unknown" ? item.country : "Unknown location"}
                    </span>
                  </div>
                </div>
                {/* Extra details visible on wider cards */}
                <div className="hidden xl:flex items-center gap-4 text-xs text-[hsl(var(--muted-foreground))] shrink-0">
                  {item.screen_resolution && (
                    <span className="flex items-center gap-1">
                      <MonitorIcon className="w-3 h-3" />
                      {item.screen_resolution}
                    </span>
                  )}
                  {item.language && (
                    <span className="uppercase">{item.language}</span>
                  )}
                  {item.ip && item.ip !== "unknown" && (
                    <span className="font-mono text-[10px]">{item.ip}</span>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs px-2 py-1 bg-[hsl(var(--card))] rounded border border-[hsl(var(--border))]">
                    {item.source || "direct"}
                  </span>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                    {formatDate(item.created_at)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Download Detail */}
      <div className="lg:sticky lg:top-8 h-fit">
        {selectedDownload ? (
          <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-6 animate-slide-in-right">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <InfoIcon className="w-5 h-5 text-[hsl(var(--primary))]" />
                Download Details
              </h3>
              <button
                onClick={() => setSelectedDownload(null)}
                className="p-1.5 rounded-lg bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--secondary))]/80 transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <DetailItem label="OS" value={`${selectedDownload.os || "Unknown"} ${selectedDownload.os_version || ""}`} />
              <DetailItem label="Browser" value={`${selectedDownload.browser || "Unknown"} ${selectedDownload.browser_version || ""}`} />
              <DetailItem label="Architecture" value={selectedDownload.architecture || "Unknown"} />
              <DetailItem label="Platform" value={selectedDownload.platform || "Unknown"} />
              <DetailItem label="Language" value={selectedDownload.language || "Unknown"} />
              <DetailItem label="Screen" value={selectedDownload.screen_resolution || "Unknown"} />
              <DetailItem label="Timezone" value={selectedDownload.timezone || "Unknown"} />
              <DetailItem label="Source" value={selectedDownload.source || "Direct"} />
              <DetailItem
                label="Location"
                value={`${selectedDownload.city !== "unknown" ? selectedDownload.city : ""}${selectedDownload.region !== "unknown" ? `, ${selectedDownload.region}` : ""}${selectedDownload.country !== "unknown" ? `, ${selectedDownload.country}` : "Unknown"}`}
                fullWidth
              />
              {selectedDownload.referrer && selectedDownload.referrer !== "" && (
                <DetailItem label="Referrer" value={selectedDownload.referrer} fullWidth truncate />
              )}
              <DetailItem label="IP Address" value={selectedDownload.ip || "Unknown"} fullWidth />
            </div>
            <div className="mt-4 pt-4 border-t border-[hsl(var(--border))]">
              <p className="text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-2">
                <ClockIcon className="w-3 h-3" />
                Downloaded: {formatDate(selectedDownload.created_at)}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] border-dashed p-12 text-center animate-fade-in">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[hsl(var(--secondary))] flex items-center justify-center">
              <CursorIcon className="w-6 h-6 text-[hsl(var(--muted-foreground))]" />
            </div>
            <p className="text-[hsl(var(--muted-foreground))]">
              Select a download to view details
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailItem({ label, value, fullWidth, truncate }: { label: string; value: string; fullWidth?: boolean; truncate?: boolean }) {
  return (
    <div className={`${fullWidth ? "col-span-2" : ""} animate-fade-in`}>
      <p className="text-[hsl(var(--muted-foreground))] mb-1 text-xs uppercase tracking-wide">{label}</p>
      <p className={`font-medium ${truncate ? "truncate" : ""}`}>{value}</p>
    </div>
  );
}

function ListIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
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

function CursorIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
      <path d="M13 13l6 6" />
    </svg>
  );
}

function MonitorIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}
