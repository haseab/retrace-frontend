"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FeedbackItem } from "@/lib/types/feedback";
import { IssueCard } from "./issue-card";
import type { MouseEvent } from "react";

interface SortableIssueCardProps {
  issue: FeedbackItem;
  isUnread: boolean;
  isSelected: boolean;
  onClick: (event: MouseEvent<HTMLDivElement>) => void;
  onHover?: () => void;
  onContextMenu?: (event: MouseEvent<HTMLDivElement>) => void;
  moveAnimationPhase?: "out" | "in" | null;
}

export function SortableIssueCard({
  issue,
  isUnread,
  isSelected,
  onClick,
  onHover,
  onContextMenu,
  moveAnimationPhase = null,
}: SortableIssueCardProps) {
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
          : moveAnimationPhase === "out"
            ? "opacity-100 animate-bulk-card-out pointer-events-none"
            : moveAnimationPhase === "in"
              ? "opacity-100 animate-bulk-card-in"
              : "opacity-100"
      }`}
    >
      <IssueCard
        issue={issue}
        isUnread={isUnread}
        isSelected={isSelected}
        onClick={onClick}
        onHover={onHover}
        onContextMenu={onContextMenu}
        compact
      />
    </div>
  );
}
