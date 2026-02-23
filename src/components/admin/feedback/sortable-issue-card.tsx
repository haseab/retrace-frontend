"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FeedbackItem } from "@/lib/types/feedback";
import { IssueCard } from "./issue-card";

interface SortableIssueCardProps {
  issue: FeedbackItem;
  isUnread: boolean;
  isSelected: boolean;
  onClick: () => void;
}

export function SortableIssueCard({ issue, isUnread, isSelected, onClick }: SortableIssueCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: issue.id.toString(),
    data: {
      type: "issue",
      issue,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || "transform 200ms cubic-bezier(0.25, 1, 0.5, 1)",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`touch-none transition-all duration-200 ${
        isDragging
          ? "z-50 opacity-90 scale-105 rotate-1 shadow-2xl shadow-black/30"
          : "opacity-100"
      }`}
    >
      <IssueCard
        issue={issue}
        isUnread={isUnread}
        isSelected={isSelected}
        onClick={onClick}
        compact
      />
    </div>
  );
}
