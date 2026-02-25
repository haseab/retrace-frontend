"use client";

import { FeedbackType, FeedbackStatus, FeedbackPriority, FeedbackFilters, ViewMode } from "@/lib/types/feedback";
import { ViewToggle } from "./view-toggle";

interface FiltersBarProps {
  filters: FeedbackFilters;
  onFiltersChange: (filters: FeedbackFilters) => void;
  view: ViewMode;
  onViewChange: (view: ViewMode) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export function FiltersBar({
  filters,
  onFiltersChange,
  view,
  onViewChange,
  onRefresh,
  isLoading,
}: FiltersBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-6 animate-fade-in">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-md group">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))] transition-colors group-focus-within:text-[hsl(var(--primary))]" />
        <input
          type="text"
          placeholder="Search issues..."
          value={filters.search || ""}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          className="w-full pl-10 pr-4 py-2 bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] rounded-lg text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:border-transparent hover:border-[hsl(var(--muted-foreground))]/50"
        />
      </div>

      {/* Type Filter */}
      <select
        value={filters.type || "all"}
        onChange={(e) => onFiltersChange({ ...filters, type: e.target.value as FeedbackType | "all" })}
        className="px-3 py-2 bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] rounded-lg text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] hover:border-[hsl(var(--muted-foreground))]/50 cursor-pointer"
      >
        <option value="all">All Types</option>
        <option value="Bug Report">Bug Reports</option>
        <option value="Feature Request">Feature Requests</option>
        <option value="Question">Questions</option>
      </select>

      {/* Status Filter (only show in list view since kanban shows status as columns) */}
      {view === "list" && (
        <select
          value={filters.status || "all"}
          onChange={(e) => onFiltersChange({ ...filters, status: e.target.value as FeedbackStatus | "all" })}
          className="px-3 py-2 bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] rounded-lg text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] hover:border-[hsl(var(--muted-foreground))]/50 cursor-pointer animate-fade-in"
        >
          <option value="all">All Statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="to_notify">To Notify</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
      )}

      {/* Priority Filter */}
      <select
        value={filters.priority || "all"}
        onChange={(e) => onFiltersChange({ ...filters, priority: e.target.value as FeedbackPriority | "all" })}
        className="px-3 py-2 bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] rounded-lg text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] hover:border-[hsl(var(--muted-foreground))]/50 cursor-pointer"
      >
        <option value="all">All Priorities</option>
        <option value="critical">Critical</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>

      {/* Spacer */}
      <div className="flex-1" />

      {/* View Toggle */}
      <ViewToggle view={view} onChange={onViewChange} />

      {/* Refresh Button */}
      <button
        onClick={onRefresh}
        disabled={isLoading}
        className="px-3 py-2 bg-[hsl(var(--secondary))] rounded-lg transition-all duration-200 hover:bg-[hsl(var(--secondary))]/80 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
      >
        <RefreshIcon className={`w-4 h-4 transition-transform duration-500 ${isLoading ? "animate-spin" : "hover:rotate-45"}`} />
      </button>
    </div>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}
