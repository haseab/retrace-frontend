"use client";

import type { ReactNode } from "react";

interface MetricCardProps {
  label: string;
  value: string;
  subtitle?: string | null;
  icon: ReactNode;
  color: string;
  bgGlow: string;
  animationDelayMs?: number;
}

export function MetricCard({
  label,
  value,
  subtitle,
  icon,
  color,
  bgGlow,
  animationDelayMs,
}: MetricCardProps) {
  return (
    <div
      className="group bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-6 transition-all duration-300 hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5 hover:border-[hsl(var(--muted-foreground))]/50 animate-slide-up"
      style={
        animationDelayMs !== undefined
          ? { animationDelay: `${animationDelayMs}ms` }
          : undefined
      }
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm text-[hsl(var(--muted-foreground))]">{label}</p>
        <div
          className={`p-2 rounded-lg ${bgGlow} ${color} transition-transform duration-300 group-hover:scale-110`}
        >
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold mb-1 transition-all duration-300 group-hover:text-[hsl(var(--primary))]">
        {value}
      </p>
      {subtitle ? (
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
