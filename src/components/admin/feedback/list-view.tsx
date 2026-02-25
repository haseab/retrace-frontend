"use client";

import { useEffect, useRef, useState } from "react";
import { FeedbackItem, FeedbackStatus, FeedbackPriority, STATUS_CONFIG, PRIORITY_CONFIG, TYPE_CONFIG } from "@/lib/types/feedback";

type SortField = "id" | "type" | "status" | "priority" | "createdAt";
type SortDirection = "asc" | "desc";

interface ListViewProps {
  issues: FeedbackItem[];
  hasMore: boolean;
  isLoadingMore: boolean;
  selectedId: number | null;
  onSelect: (issue: FeedbackItem) => void;
  onUpdateStatus: (id: number, status: FeedbackStatus) => Promise<void>;
  onUpdatePriority: (id: number, priority: FeedbackPriority) => Promise<void>;
  onLoadMore: () => void;
}

export function ListView({
  issues,
  hasMore,
  isLoadingMore,
  selectedId,
  onSelect,
  onUpdateStatus,
  onUpdatePriority,
  onLoadMore,
}: ListViewProps) {
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hasMore || isLoadingMore) {
      return;
    }

    const target = loadMoreRef.current;
    if (!target) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          onLoadMore();
        }
      },
      {
        root: null,
        rootMargin: "240px 0px",
        threshold: 0.1,
      }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, onLoadMore, issues.length]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const sortedIssues = [...issues].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case "id":
        comparison = a.id - b.id;
        break;
      case "type":
        comparison = a.type.localeCompare(b.type);
        break;
      case "status":
        const statusOrder = { open: 0, in_progress: 1, to_notify: 2, resolved: 3, closed: 4 };
        comparison = statusOrder[a.status] - statusOrder[b.status];
        break;
      case "priority":
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
        break;
      case "createdAt":
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
    }
    return sortDirection === "asc" ? comparison : -comparison;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] overflow-hidden animate-fade-in">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--secondary))]">
              <SortableHeader field="id" label="#" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} className="w-16" />
              <SortableHeader field="type" label="Type" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} className="w-32" />
              <th className="text-left px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                Description
              </th>
              <SortableHeader field="status" label="Status" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} className="w-36" />
              <SortableHeader field="priority" label="Priority" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} className="w-32" />
              <th className="text-left px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider w-24">
                Version
              </th>
              <SortableHeader field="createdAt" label="Date" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} className="w-36" />
            </tr>
          </thead>
          <tbody>
            {sortedIssues.map((issue, index) => {
              const typeConfig = TYPE_CONFIG[issue.type] || { label: issue.type, color: "bg-gray-500/20 text-gray-400 border-gray-500/30" };
              const isSelected = selectedId === issue.id;

              return (
                <tr
                  key={issue.id}
                  onClick={() => onSelect(issue)}
                  className={`border-b border-[hsl(var(--border))] cursor-pointer transition-all duration-200 animate-card-enter ${
                    isSelected
                      ? "bg-[hsl(var(--primary))]/10 shadow-inner"
                      : "hover:bg-[hsl(var(--secondary))] hover:shadow-sm"
                  }`}
                  style={{ animationDelay: `${index * 20}ms` }}
                >
                  <td className="px-4 py-3 text-sm text-[hsl(var(--muted-foreground))]">
                    {issue.id}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded border ${typeConfig.color}`}>
                      {issue.type === "Bug Report" ? "Bug" : issue.type === "Feature Request" ? "Feature" : "Question"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm max-w-md">
                    <p className="line-clamp-1">{issue.description}</p>
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={issue.status}
                      onChange={(e) => onUpdateStatus(issue.id, e.target.value as FeedbackStatus)}
                      className={`px-2 py-1 text-xs font-medium rounded border cursor-pointer focus:outline-none focus:ring-1 focus:ring-[hsl(var(--ring))] ${STATUS_CONFIG[issue.status].color}`}
                    >
                      {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                        <option key={value} value={value}>
                          {config.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={issue.priority}
                      onChange={(e) => onUpdatePriority(issue.id, e.target.value as FeedbackPriority)}
                      className={`px-2 py-1 text-xs font-medium rounded border cursor-pointer focus:outline-none focus:ring-1 focus:ring-[hsl(var(--ring))] ${PRIORITY_CONFIG[issue.priority].color}`}
                    >
                      {Object.entries(PRIORITY_CONFIG).map(([value, config]) => (
                        <option key={value} value={value}>
                          {config.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-sm text-[hsl(var(--muted-foreground))]">
                    v{issue.appVersion}
                  </td>
                  <td className="px-4 py-3 text-sm text-[hsl(var(--muted-foreground))]">
                    {formatDate(issue.createdAt)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {issues.length === 0 && (
        <div className="text-center py-12 text-[hsl(var(--muted-foreground))]">
          No issues found
        </div>
      )}
      {issues.length > 0 && (
        <div
          ref={loadMoreRef}
          className="py-3 text-center text-xs text-[hsl(var(--muted-foreground))]"
        >
          {isLoadingMore ? "Loading more..." : hasMore ? "Scroll for more" : "End of results"}
        </div>
      )}
    </div>
  );
}

interface SortableHeaderProps {
  field: SortField;
  label: string;
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  className?: string;
}

function SortableHeader({ field, label, sortField, sortDirection, onSort, className }: SortableHeaderProps) {
  const isActive = sortField === field;

  return (
    <th
      className={`text-left px-4 py-3 text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider cursor-pointer hover:text-white transition-all duration-200 hover:bg-[hsl(var(--card))]/30 ${className}`}
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        <span className={`transition-all duration-200 ${isActive ? "text-[hsl(var(--primary))] opacity-100" : "opacity-0"}`}>
          {sortDirection === "asc" ? "↑" : "↓"}
        </span>
      </div>
    </th>
  );
}
