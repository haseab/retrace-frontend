"use client";

import { DownloadStats } from "@/lib/types/feedback";

interface StatsCardsProps {
  stats: DownloadStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const byOs = stats.byOs || [];
  const bySource = stats.bySource || [];

  const cards = [
    {
      label: "Total Downloads",
      value: Number(stats.totalDownloads || 0).toLocaleString(),
      subtitle: null,
      icon: <DownloadIcon className="w-5 h-5" />,
      color: "text-blue-400",
      bgGlow: "bg-blue-500/10",
    },
    {
      label: "Top OS",
      value: byOs[0]?.os || "N/A",
      subtitle: byOs[0]?.count ? `${Number(byOs[0].count).toLocaleString()} downloads` : null,
      icon: <MonitorIcon className="w-5 h-5" />,
      color: "text-green-400",
      bgGlow: "bg-green-500/10",
    },
    {
      label: "Top Source",
      value: bySource[0]?.source || "N/A",
      subtitle: bySource[0]?.count ? `${Number(bySource[0].count).toLocaleString()} downloads` : null,
      icon: <LinkIcon className="w-5 h-5" />,
      color: "text-violet-400",
      bgGlow: "bg-violet-500/10",
    },
    {
      label: "Unique Sources",
      value: bySource.length.toString(),
      subtitle: "referral channels",
      icon: <GridIcon className="w-5 h-5" />,
      color: "text-amber-400",
      bgGlow: "bg-amber-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <div
          key={card.label}
          className="group bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-6 transition-all duration-300 hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5 hover:border-[hsl(var(--muted-foreground))]/50 animate-slide-up"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div className="flex items-start justify-between mb-3">
            <p className="text-sm text-[hsl(var(--muted-foreground))]">{card.label}</p>
            <div className={`p-2 rounded-lg ${card.bgGlow} ${card.color} transition-transform duration-300 group-hover:scale-110`}>
              {card.icon}
            </div>
          </div>
          <p className="text-3xl font-bold mb-1 transition-all duration-300 group-hover:text-[hsl(var(--primary))]">
            {card.value}
          </p>
          {card.subtitle && (
            <p className="text-sm text-[hsl(var(--muted-foreground))]">{card.subtitle}</p>
          )}
        </div>
      ))}
    </div>
  );
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
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

function LinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function GridIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}
