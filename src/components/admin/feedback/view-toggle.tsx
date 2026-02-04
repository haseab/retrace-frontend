"use client";

import { ViewMode } from "@/lib/types/feedback";

interface ViewToggleProps {
  view: ViewMode;
  onChange: (view: ViewMode) => void;
}

export function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <div className="relative flex gap-1 bg-[hsl(var(--secondary))] p-1 rounded-lg">
      <button
        onClick={() => onChange("kanban")}
        className={`relative px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
          view === "kanban"
            ? "bg-[hsl(var(--card))] text-white shadow-md"
            : "text-[hsl(var(--muted-foreground))] hover:text-white hover:bg-[hsl(var(--card))]/30"
        }`}
      >
        <KanbanIcon className={`w-4 h-4 transition-transform duration-200 ${view === "kanban" ? "scale-110" : ""}`} />
        Kanban
      </button>
      <button
        onClick={() => onChange("list")}
        className={`relative px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
          view === "list"
            ? "bg-[hsl(var(--card))] text-white shadow-md"
            : "text-[hsl(var(--muted-foreground))] hover:text-white hover:bg-[hsl(var(--card))]/30"
        }`}
      >
        <ListIcon className={`w-4 h-4 transition-transform duration-200 ${view === "list" ? "scale-110" : ""}`} />
        List
      </button>
    </div>
  );
}

function KanbanIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <rect x="3" y="3" width="5" height="18" rx="1" />
      <rect x="10" y="3" width="5" height="12" rx="1" />
      <rect x="17" y="3" width="5" height="8" rx="1" />
    </svg>
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
