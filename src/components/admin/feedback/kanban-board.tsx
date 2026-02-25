"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  rectIntersection,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { FeedbackItem, FeedbackStatus } from "@/lib/types/feedback";
import { KanbanColumn } from "./kanban-column";
import { IssueCard } from "./issue-card";

const STATUSES: FeedbackStatus[] = ["open", "in_progress", "to_notify", "notified", "resolved", "closed", "back_burner"];

interface KanbanBoardProps {
  issuesByStatus: Record<FeedbackStatus, FeedbackItem[]>;
  hasMoreByStatus: Record<FeedbackStatus, boolean>;
  isLoadingByStatus: Record<FeedbackStatus, boolean>;
  selectedId: number | null;
  onSelect: (issue: FeedbackItem) => void;
  onUpdateStatus: (id: number, status: FeedbackStatus) => Promise<void>;
  onLoadMore: (status: FeedbackStatus) => void;
  onIssueHover?: (issueId: number) => void;
}

function getCreatedTimestamp(createdAt: string): number {
  const timestamp = new Date(createdAt).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

export function KanbanBoard({
  issuesByStatus,
  hasMoreByStatus,
  isLoadingByStatus,
  selectedId,
  onSelect,
  onUpdateStatus,
  onLoadMore,
  onIssueHover,
}: KanbanBoardProps) {
  const [activeIssue, setActiveIssue] = useState<FeedbackItem | null>(null);

  const allIssues = STATUSES.flatMap((status) => issuesByStatus[status] ?? []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const sortedIssuesByStatus = STATUSES.reduce((acc, status) => {
    const issues = issuesByStatus[status] ?? [];
    acc[status] = [...issues].sort((a, b) => getCreatedTimestamp(b.createdAt) - getCreatedTimestamp(a.createdAt));
    return acc;
  }, {} as Record<FeedbackStatus, FeedbackItem[]>);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const issue = allIssues.find((i) => i.id.toString() === active.id);
    if (issue) {
      setActiveIssue(issue);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveIssue(null);

    if (!over) return;

    const activeId = active.id.toString();
    const overId = over.id.toString();

    // Find the issue being dragged
    const draggedIssue = allIssues.find((i) => i.id.toString() === activeId);
    if (!draggedIssue) return;

    // Determine the target status
    let targetStatus: FeedbackStatus | null = null;

    // Check if dropped on a column directly (column IDs are the status values)
    if (STATUSES.includes(overId as FeedbackStatus)) {
      targetStatus = overId as FeedbackStatus;
    } else {
      // Dropped on another issue - find which column that issue is in
      const overIssue = allIssues.find((i) => i.id.toString() === overId);
      if (overIssue) {
        targetStatus = overIssue.status;
      }
    }

    // Update status if it changed
    if (targetStatus && targetStatus !== draggedIssue.status) {
      await onUpdateStatus(draggedIssue.id, targetStatus);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={rectIntersection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STATUSES.map((status, index) => (
          <div
            key={status}
            className="animate-slide-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <KanbanColumn
              status={status}
              issues={sortedIssuesByStatus[status]}
              hasMore={hasMoreByStatus[status]}
              isLoadingMore={isLoadingByStatus[status]}
              onLoadMore={onLoadMore}
              selectedId={selectedId}
              onSelect={onSelect}
              onIssueHover={onIssueHover}
            />
          </div>
        ))}
      </div>

      <DragOverlay dropAnimation={{
        duration: 200,
        easing: "cubic-bezier(0.25, 1, 0.5, 1)",
      }}>
        {activeIssue && (
          <div className="rotate-2 scale-105 shadow-2xl shadow-black/40 animate-pop">
            <IssueCard
              issue={activeIssue}
              isUnread={!activeIssue.isRead}
              compact
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
