"use client";

import { cn } from "@/lib/utils";

export function AnimatedGradient({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/15 via-blue-500/20 to-blue-400/15 animate-pulse" />
      <div className="absolute inset-0 bg-gradient-to-l from-blue-400/10 via-blue-600/15 to-blue-500/10 animate-pulse delay-75" />
      {children && <div className="relative">{children}</div>}
    </div>
  );
}
