"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  onDelete: (id: number) => Promise<void>;
  onLoadMore: (status: FeedbackStatus) => void;
  onIssueHover?: (issueId: number) => void;
}

interface ContextMenuState {
  issue: FeedbackItem;
  x: number;
  y: number;
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
  onDelete,
  onLoadMore,
  onIssueHover,
}: KanbanBoardProps) {
  const [activeIssue, setActiveIssue] = useState<FeedbackItem | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [deleteTargetIssue, setDeleteTargetIssue] = useState<FeedbackItem | null>(null);
  const [isDeletingIssue, setIsDeletingIssue] = useState(false);
  const [deleteIssueError, setDeleteIssueError] = useState<string | null>(null);
  const contextMenuRef = useRef<HTMLDivElement | null>(null);

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

  const contextMenuPosition = useMemo(() => {
    if (!contextMenu) {
      return null;
    }

    if (typeof window === "undefined") {
      return { left: contextMenu.x, top: contextMenu.y };
    }

    const menuWidth = 200;
    const menuHeight = 104;
    const viewportPadding = 12;

    return {
      left: Math.max(
        viewportPadding,
        Math.min(contextMenu.x, window.innerWidth - menuWidth - viewportPadding)
      ),
      top: Math.max(
        viewportPadding,
        Math.min(contextMenu.y, window.innerHeight - menuHeight - viewportPadding)
      ),
    };
  }, [contextMenu]);

  useEffect(() => {
    if (!contextMenu) {
      return;
    }

    const handlePointerDown = (event: globalThis.PointerEvent) => {
      if (contextMenuRef.current?.contains(event.target as Node)) {
        return;
      }

      setContextMenu(null);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setContextMenu(null);
      }
    };

    const handleWindowBlur = () => {
      setContextMenu(null);
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [contextMenu]);

  useEffect(() => {
    if (!contextMenu) {
      return;
    }

    const issueStillExists = allIssues.some((issue) => issue.id === contextMenu.issue.id);
    if (!issueStillExists) {
      setContextMenu(null);
    }
  }, [allIssues, contextMenu]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setContextMenu(null);
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

  const handleIssueContextMenu = (event: MouseEvent<HTMLDivElement>, issue: FeedbackItem) => {
    event.preventDefault();
    event.stopPropagation();
    setDeleteIssueError(null);
    setContextMenu({
      issue,
      x: event.clientX,
      y: event.clientY,
    });
  };

  const handleOpenIssueFromMenu = () => {
    if (!contextMenu) {
      return;
    }

    onSelect(contextMenu.issue);
    setContextMenu(null);
  };

  const handleDeleteIssueFromMenu = () => {
    if (!contextMenu) {
      return;
    }

    setDeleteIssueError(null);
    setDeleteTargetIssue(contextMenu.issue);
    setContextMenu(null);
  };

  const handleConfirmDeleteIssue = async () => {
    if (!deleteTargetIssue || isDeletingIssue) {
      return;
    }

    setIsDeletingIssue(true);
    setDeleteIssueError(null);

    try {
      await onDelete(deleteTargetIssue.id);
      setDeleteTargetIssue(null);
    } catch (error) {
      setDeleteIssueError(error instanceof Error ? error.message : "Failed to delete issue.");
    } finally {
      setIsDeletingIssue(false);
    }
  };

  return (
    <>
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
                onIssueContextMenu={handleIssueContextMenu}
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

      {contextMenu && contextMenuPosition && (
        <div
          ref={contextMenuRef}
          role="menu"
          className="fixed z-[80] min-w-[200px] overflow-hidden rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-2xl shadow-black/40 backdrop-blur-sm"
          style={{
            left: `${contextMenuPosition.left}px`,
            top: `${contextMenuPosition.top}px`,
          }}
        >
          <div className="border-b border-[hsl(var(--border))] px-3 py-2">
            <p className="text-xs font-medium text-[hsl(var(--foreground))]">
              Issue #{contextMenu.issue.id}
            </p>
            <p className="truncate text-[11px] text-[hsl(var(--muted-foreground))]">
              {contextMenu.issue.type}
            </p>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={handleOpenIssueFromMenu}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-[hsl(var(--secondary))]"
          >
            <OpenIcon className="h-4 w-4" />
            Open issue
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={handleDeleteIssueFromMenu}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-200 transition-colors hover:bg-red-500/20"
          >
            <TrashIcon className="h-4 w-4" />
            Delete issue
          </button>
        </div>
      )}

      <Dialog
        open={deleteTargetIssue !== null}
        onOpenChange={(open) => {
          if (!isDeletingIssue && !open) {
            setDeleteTargetIssue(null);
            setDeleteIssueError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-300">
              <TrashIcon className="h-4 w-4" />
              Delete Issue {deleteTargetIssue ? `#${deleteTargetIssue.id}` : ""}?
            </DialogTitle>
            <DialogDescription className="pt-1">
              This will permanently delete this issue and all associated notes. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {deleteIssueError && (
            <p className="text-sm text-red-400">{deleteIssueError}</p>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            <button
              type="button"
              onClick={() => {
                setDeleteTargetIssue(null);
                setDeleteIssueError(null);
              }}
              disabled={isDeletingIssue}
              className="px-3 py-2 text-sm rounded-lg border border-[hsl(var(--border))] hover:bg-[hsl(var(--secondary))] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDeleteIssue}
              disabled={isDeletingIssue}
              className="px-3 py-2 text-sm rounded-lg border border-red-500/40 bg-red-500/20 text-red-200 hover:bg-red-500/30 transition-colors disabled:opacity-50"
            >
              {isDeletingIssue ? "Deleting..." : "Delete Permanently"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function OpenIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path d="M7 17 17 7" />
      <path d="M8 7h9v9" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="m19 6-1 14H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}
