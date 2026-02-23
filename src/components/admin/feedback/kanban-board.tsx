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

const STATUSES: FeedbackStatus[] = ["open", "in_progress", "resolved", "closed"];

interface KanbanBoardProps {
  issues: FeedbackItem[];
  selectedId: number | null;
  onSelect: (issue: FeedbackItem) => void;
  onUpdateStatus: (id: number, status: FeedbackStatus) => Promise<void>;
}

function getCreatedTimestamp(createdAt: string): number {
  const timestamp = new Date(createdAt).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

export function KanbanBoard({ issues, selectedId, onSelect, onUpdateStatus }: KanbanBoardProps) {
  const [activeIssue, setActiveIssue] = useState<FeedbackItem | null>(null);

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

  const issuesByStatus = STATUSES.reduce((acc, status) => {
    acc[status] = issues
      .filter((issue) => issue.status === status)
      .sort((a, b) => getCreatedTimestamp(b.createdAt) - getCreatedTimestamp(a.createdAt));
    return acc;
  }, {} as Record<FeedbackStatus, FeedbackItem[]>);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const issue = issues.find((i) => i.id.toString() === active.id);
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
    const draggedIssue = issues.find((i) => i.id.toString() === activeId);
    if (!draggedIssue) return;

    // Determine the target status
    let targetStatus: FeedbackStatus | null = null;

    // Check if dropped on a column directly (column IDs are the status values)
    if (STATUSES.includes(overId as FeedbackStatus)) {
      targetStatus = overId as FeedbackStatus;
    } else {
      // Dropped on another issue - find which column that issue is in
      const overIssue = issues.find((i) => i.id.toString() === overId);
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
              issues={issuesByStatus[status]}
              selectedId={selectedId}
              onSelect={onSelect}
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
