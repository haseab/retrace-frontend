"use client";

import { useState } from "react";

interface ChartData {
  label: string;
  count: number;
}

interface DownloadChartProps {
  title: string;
  data: ChartData[];
  total: number;
  color: string;
}

export function DownloadChart({ title, data, total, color }: DownloadChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-6 transition-all duration-300 hover:shadow-lg hover:shadow-black/10">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="space-y-3">
        {data.map((item, index) => {
          const percentage = (Number(item.count) / Number(total)) * 100;
          const isHovered = hoveredIndex === index;

          return (
            <div
              key={item.label || "unknown"}
              className="animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div className={`flex items-center justify-between text-sm mb-1 transition-all duration-200 ${isHovered ? "text-[hsl(var(--foreground))]" : ""}`}>
                <span className={`transition-all duration-200 ${isHovered ? "font-medium translate-x-1" : ""}`}>
                  {item.label || "Unknown"}
                </span>
                <span className={`transition-all duration-200 ${isHovered ? "text-[hsl(var(--foreground))] font-medium" : "text-[hsl(var(--muted-foreground))]"}`}>
                  {Number(item.count).toLocaleString()} ({percentage.toFixed(1)}%)
                </span>
              </div>
              <div className="h-2 bg-[hsl(var(--secondary))] rounded-full overflow-hidden">
                <div
                  className={`h-full ${color} rounded-full transition-all duration-500 ease-out ${isHovered ? "opacity-100 shadow-lg" : "opacity-80"}`}
                  style={{
                    width: `${percentage}%`,
                    boxShadow: isHovered ? `0 0 12px ${color.replace("bg-", "").replace("-500", "")}` : undefined,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
