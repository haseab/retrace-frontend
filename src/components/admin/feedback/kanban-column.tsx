"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { FeedbackItem, FeedbackStatus, STATUS_CONFIG } from "@/lib/types/feedback";
import { SortableIssueCard } from "./sortable-issue-card";

interface KanbanColumnProps {
  status: FeedbackStatus;
  issues: FeedbackItem[];
  selectedId: number | null;
  onSelect: (issue: FeedbackItem) => void;
}

export function KanbanColumn({ status, issues, selectedId, onSelect }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: {
      type: "column",
      status,
    },
  });

  const statusConfig = STATUS_CONFIG[status];
  const issueIds = issues.map((issue) => issue.id.toString());
  const unreadCount = issues.reduce((count, issue) => count + (issue.isRead ? 0 : 1), 0);

  return (
    <div className="flex flex-col min-w-[280px] max-w-[320px] flex-1 max-h-[calc(100vh-220px)] animate-fade-in">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-3 px-1 shrink-0">
        <div className="flex items-center gap-2">
          <StatusDot status={status} />
          <h3 className="font-medium text-sm">{statusConfig.label}</h3>
          <span className="text-xs text-[hsl(var(--muted-foreground))] bg-[hsl(var(--secondary))] px-2 py-0.5 rounded-full transition-all duration-300">
            {issues.length}
          </span>
          {unreadCount > 0 && (
            <span className="text-xs text-sky-300 bg-sky-500/10 border border-sky-500/30 px-2 py-0.5 rounded-full transition-all duration-300">
              {unreadCount} unread
            </span>
          )}
        </div>
      </div>

      {/* Drop Zone - entire column is droppable */}
      <div
        ref={setNodeRef}
        className={`flex-1 rounded-xl p-2 min-h-[200px] overflow-y-auto transition-all duration-300 ease-out ${
          isOver
            ? "bg-[hsl(var(--primary))]/20 ring-2 ring-[hsl(var(--primary))] ring-inset scale-[1.01] shadow-lg shadow-[hsl(var(--primary))]/10"
            : "bg-[hsl(var(--secondary))]/50"
        }`}
      >
        <SortableContext items={issueIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {issues.map((issue, index) => (
              <div
                key={issue.id}
                className="animate-card-enter"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <SortableIssueCard
                  issue={issue}
                  isUnread={!issue.isRead}
                  isSelected={selectedId === issue.id}
                  onClick={() => onSelect(issue)}
                />
              </div>
            ))}
          </div>
        </SortableContext>

        {issues.length === 0 && (
          <div className={`flex items-center justify-center h-32 text-sm transition-all duration-300 ${
            isOver ? "text-[hsl(var(--primary))] scale-105" : "text-[hsl(var(--muted-foreground))]"
          }`}>
            {isOver ? "Drop here" : "No issues"}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusDot({ status }: { status: FeedbackStatus }) {
  const colors: Record<FeedbackStatus, string> = {
    open: "bg-blue-500 shadow-blue-500/50",
    in_progress: "bg-yellow-500 shadow-yellow-500/50",
    resolved: "bg-green-500 shadow-green-500/50",
    closed: "bg-gray-500",
  };

  const shouldPulse = status === "open" || status === "in_progress";

  return (
    <div className={`w-2 h-2 rounded-full shadow-sm transition-all duration-300 ${colors[status]} ${shouldPulse ? "animate-pulse-soft" : ""}`} />
  );
}
