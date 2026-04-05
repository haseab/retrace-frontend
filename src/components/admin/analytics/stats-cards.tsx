"use client";

import { Download, Grid2x2, Link2, Monitor } from "lucide-react";
import type { SiteAnalytics } from "@/lib/types/feedback";
import { MetricCard } from "@/components/admin/analytics/metric-card";

interface StatsCardsProps {
  stats: SiteAnalytics;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const byOs = stats.byOs || [];
  const bySource = stats.bySource || [];

  const cards = [
    {
      label: "Total Downloads",
      value: Number(stats.totalDownloads || 0).toLocaleString(),
      subtitle: null,
      icon: <Download className="w-5 h-5" />,
      color: "text-blue-400",
      bgGlow: "bg-blue-500/10",
    },
    {
      label: "Top OS",
      value: byOs[0]?.os || "N/A",
      subtitle: byOs[0]?.count
        ? `${Number(byOs[0].count).toLocaleString()} downloads`
        : null,
      icon: <Monitor className="w-5 h-5" />,
      color: "text-green-400",
      bgGlow: "bg-green-500/10",
    },
    {
      label: "Top Source",
      value: bySource[0]?.source || "N/A",
      subtitle: bySource[0]?.count
        ? `${Number(bySource[0].count).toLocaleString()} downloads`
        : null,
      icon: <Link2 className="w-5 h-5" />,
      color: "text-violet-400",
      bgGlow: "bg-violet-500/10",
    },
    {
      label: "Unique Sources",
      value: bySource.length.toString(),
      subtitle: "referral channels",
      icon: <Grid2x2 className="w-5 h-5" />,
      color: "text-amber-400",
      bgGlow: "bg-amber-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <MetricCard
          key={card.label}
          label={card.label}
          value={card.value}
          subtitle={card.subtitle}
          icon={card.icon}
          color={card.color}
          bgGlow={card.bgGlow}
          animationDelayMs={index * 50}
        />
      ))}
    </div>
  );
}
