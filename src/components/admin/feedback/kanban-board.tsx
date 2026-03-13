"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from "react";
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
import { FeedbackItem, FeedbackStatus, STATUS_CONFIG } from "@/lib/types/feedback";
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
const BULK_MOVE_OUT_DURATION_MS = 140;
const BULK_MOVE_IN_DURATION_MS = 700;

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
  issueIds: number[];
  x: number;
  y: number;
}

interface SelectionBoxState {
  pointerId: number;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

interface SelectionRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

function getCreatedTimestamp(createdAt: string): number {
  const timestamp = new Date(createdAt).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function getSelectionRect(startX: number, startY: number, endX: number, endY: number): SelectionRect {
  const left = Math.min(startX, endX);
  const top = Math.min(startY, endY);
  const right = Math.max(startX, endX);
  const bottom = Math.max(startY, endY);

  return {
    left,
    top,
    right,
    bottom,
    width: right - left,
    height: bottom - top,
  };
}

function intersectsSelectionRect(selectionRect: SelectionRect, nodeRect: DOMRect): boolean {
  return !(
    selectionRect.right < nodeRect.left ||
    selectionRect.left > nodeRect.right ||
    selectionRect.bottom < nodeRect.top ||
    selectionRect.top > nodeRect.bottom
  );
}

function areIdListsEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) {
    return false;
  }

  for (let index = 0; index < a.length; index += 1) {
    if (a[index] !== b[index]) {
      return false;
    }
  }

  return true;
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
  const [selectedIssueIds, setSelectedIssueIds] = useState<number[]>([]);
  const [selectionBox, setSelectionBox] = useState<SelectionBoxState | null>(null);

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [deleteTargetIds, setDeleteTargetIds] = useState<number[]>([]);
  const [isDeletingIssue, setIsDeletingIssue] = useState(false);
  const [deleteIssueError, setDeleteIssueError] = useState<string | null>(null);

  const [isBulkMoving, setIsBulkMoving] = useState(false);
  const [bulkActionError, setBulkActionError] = useState<string | null>(null);
  const [bulkMoveTargetStatus, setBulkMoveTargetStatus] = useState<FeedbackStatus | null>(null);
  const [movingOutIssueIds, setMovingOutIssueIds] = useState<number[]>([]);
  const [movingInIssueIds, setMovingInIssueIds] = useState<number[]>([]);

  const boardRef = useRef<HTMLDivElement | null>(null);
  const contextMenuRef = useRef<HTMLDivElement | null>(null);
  const clearMovingStateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const allIssues = STATUSES.flatMap((status) => issuesByStatus[status] ?? []);

  const selectedIssueIdSet = useMemo(() => new Set(selectedIssueIds), [selectedIssueIds]);
  const movingOutIssueIdSet = useMemo(() => new Set(movingOutIssueIds), [movingOutIssueIds]);
  const movingInIssueIdSet = useMemo(() => new Set(movingInIssueIds), [movingInIssueIds]);

  const issuesById = useMemo(() => {
    return new Map(allIssues.map((issue) => [issue.id, issue]));
  }, [allIssues]);

  const selectionRect = useMemo(() => {
    if (!selectionBox) {
      return null;
    }

    return getSelectionRect(
      selectionBox.startX,
      selectionBox.startY,
      selectionBox.currentX,
      selectionBox.currentY
    );
  }, [selectionBox]);

  const contextMenuIssues = useMemo(() => {
    if (!contextMenu) {
      return [];
    }

    return contextMenu.issueIds
      .map((issueId) => issuesById.get(issueId))
      .filter((issue): issue is FeedbackItem => issue !== undefined);
  }, [contextMenu, issuesById]);

  const primaryContextMenuIssue = contextMenuIssues.length === 1 ? contextMenuIssues[0] : null;

  const sortedIssuesByStatus = STATUSES.reduce((acc, status) => {
    const issues = issuesByStatus[status] ?? [];
    acc[status] = [...issues].sort((a, b) => getCreatedTimestamp(b.createdAt) - getCreatedTimestamp(a.createdAt));
    return acc;
  }, {} as Record<FeedbackStatus, FeedbackItem[]>);

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

  const contextMenuPosition = useMemo(() => {
    if (!contextMenu) {
      return null;
    }

    if (typeof window === "undefined") {
      return { left: contextMenu.x, top: contextMenu.y };
    }

    const menuWidth = 248;
    const menuHeight = contextMenu.issueIds.length > 1 ? 380 : 418;
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
    return () => {
      if (clearMovingStateTimeoutRef.current) {
        clearTimeout(clearMovingStateTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const allIssueIds = new Set(allIssues.map((issue) => issue.id));

    setSelectedIssueIds((previousIds) => {
      const nextIds = previousIds.filter((issueId) => allIssueIds.has(issueId));
      return areIdListsEqual(previousIds, nextIds) ? previousIds : nextIds;
    });

    setDeleteTargetIds((previousIds) => {
      const nextIds = previousIds.filter((issueId) => allIssueIds.has(issueId));
      return areIdListsEqual(previousIds, nextIds) ? previousIds : nextIds;
    });

    setContextMenu((previousMenu) => {
      if (!previousMenu) {
        return previousMenu;
      }

      const nextIssueIds = previousMenu.issueIds.filter((issueId) => allIssueIds.has(issueId));
      if (nextIssueIds.length === 0) {
        return null;
      }

      return areIdListsEqual(previousMenu.issueIds, nextIssueIds)
        ? previousMenu
        : { ...previousMenu, issueIds: nextIssueIds };
    });
  }, [allIssues]);

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
    if (!selectionBox) {
      return;
    }

    const { pointerId } = selectionBox;

    const handlePointerMove = (event: globalThis.PointerEvent) => {
      if (event.pointerId !== pointerId) {
        return;
      }

      setSelectionBox((previousBox) => {
        if (!previousBox || previousBox.pointerId !== pointerId) {
          return previousBox;
        }

        return {
          ...previousBox,
          currentX: event.clientX,
          currentY: event.clientY,
        };
      });
    };

    const finishSelection = (event: globalThis.PointerEvent) => {
      if (event.pointerId !== pointerId) {
        return;
      }

      setSelectionBox(null);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", finishSelection);
    window.addEventListener("pointercancel", finishSelection);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", finishSelection);
      window.removeEventListener("pointercancel", finishSelection);
    };
  }, [selectionBox]);

  useEffect(() => {
    if (!selectionRect || !boardRef.current) {
      return;
    }

    const cardNodes = boardRef.current.querySelectorAll<HTMLElement>("[data-feedback-card-id]");
    const selectedByBox: number[] = [];

    cardNodes.forEach((node) => {
      const rawId = node.dataset.feedbackCardId;
      if (!rawId) {
        return;
      }

      const issueId = Number(rawId);
      if (!Number.isInteger(issueId)) {
        return;
      }

      if (intersectsSelectionRect(selectionRect, node.getBoundingClientRect())) {
        selectedByBox.push(issueId);
      }
    });

    setSelectedIssueIds((previousIds) => {
      if (areIdListsEqual(previousIds, selectedByBox)) {
        return previousIds;
      }

      return selectedByBox;
    });
  }, [selectionRect, allIssues.length]);

  const handleBoardPointerDownCapture = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || !event.shiftKey) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    setBulkActionError(null);
    setContextMenu(null);
    setSelectionBox({
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      currentX: event.clientX,
      currentY: event.clientY,
    });
    setSelectedIssueIds([]);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setContextMenu(null);

    const issue = allIssues.find((candidate) => candidate.id.toString() === active.id);
    if (issue) {
      if (selectedIssueIds.length > 1 && selectedIssueIdSet.has(issue.id)) {
        setSelectedIssueIds([issue.id]);
      }
      setActiveIssue(issue);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveIssue(null);

    if (!over) {
      return;
    }

    const activeId = active.id.toString();
    const overId = over.id.toString();

    const draggedIssue = allIssues.find((issue) => issue.id.toString() === activeId);
    if (!draggedIssue) {
      return;
    }

    let targetStatus: FeedbackStatus | null = null;

    if (STATUSES.includes(overId as FeedbackStatus)) {
      targetStatus = overId as FeedbackStatus;
    } else {
      const overIssue = allIssues.find((issue) => issue.id.toString() === overId);
      if (overIssue) {
        targetStatus = overIssue.status;
      }
    }

    if (targetStatus && targetStatus !== draggedIssue.status) {
      await onUpdateStatus(draggedIssue.id, targetStatus);
    }
  };

  const handleIssueSelect = (issue: FeedbackItem, event: ReactMouseEvent<HTMLDivElement>) => {
    const isToggleSelection = event.metaKey || event.ctrlKey;

    if (isToggleSelection) {
      event.preventDefault();
      event.stopPropagation();
      setContextMenu(null);
      setBulkActionError(null);
      setSelectedIssueIds((previousIds) => {
        if (previousIds.includes(issue.id)) {
          return previousIds.filter((issueId) => issueId !== issue.id);
        }

        return [...previousIds, issue.id];
      });
      return;
    }

    setSelectedIssueIds([]);
    onSelect(issue);
  };

  const handleIssueContextMenu = (event: ReactMouseEvent<HTMLDivElement>, issue: FeedbackItem) => {
    event.preventDefault();
    event.stopPropagation();

    setDeleteIssueError(null);
    setBulkActionError(null);

    const issueIds = selectedIssueIdSet.has(issue.id) && selectedIssueIds.length > 1
      ? [...selectedIssueIds]
      : [issue.id];

    if (issueIds.length === 1) {
      setSelectedIssueIds([issue.id]);
    }

    setContextMenu({
      issueIds,
      x: event.clientX,
      y: event.clientY,
    });
  };

  const handleOpenIssueFromMenu = () => {
    if (!primaryContextMenuIssue) {
      return;
    }

    setSelectedIssueIds([]);
    onSelect(primaryContextMenuIssue);
    setContextMenu(null);
  };

  const handleDeleteIssueFromMenu = () => {
    if (contextMenuIssues.length === 0) {
      return;
    }

    setDeleteIssueError(null);
    setDeleteTargetIds(contextMenuIssues.map((issue) => issue.id));
    setContextMenu(null);
  };

  const handleMoveIssuesFromMenu = async (targetStatus: FeedbackStatus) => {
    if (isBulkMoving || contextMenuIssues.length === 0) {
      return;
    }

    const issueIdsToMove = contextMenuIssues
      .filter((issue) => issue.status !== targetStatus)
      .map((issue) => issue.id);

    setContextMenu(null);
    if (issueIdsToMove.length === 0) {
      return;
    }

    setBulkActionError(null);
    setIsBulkMoving(true);
    setBulkMoveTargetStatus(targetStatus);
    setMovingOutIssueIds(issueIdsToMove);

    let moveHadFailure = false;

    try {
      await new Promise<void>((resolve) => {
        setTimeout(resolve, BULK_MOVE_OUT_DURATION_MS);
      });

      await Promise.all(issueIdsToMove.map((issueId) => onUpdateStatus(issueId, targetStatus)));
      setMovingInIssueIds(issueIdsToMove);

      if (clearMovingStateTimeoutRef.current) {
        clearTimeout(clearMovingStateTimeoutRef.current);
      }

      clearMovingStateTimeoutRef.current = setTimeout(() => {
        setMovingInIssueIds([]);
        setBulkMoveTargetStatus(null);
      }, BULK_MOVE_IN_DURATION_MS);
    } catch (_error) {
      moveHadFailure = true;
      setBulkMoveTargetStatus(null);
      setBulkActionError("Some issues could not be moved. Please try again.");
    } finally {
      setMovingOutIssueIds([]);
      setIsBulkMoving(false);
      if (moveHadFailure) {
        setMovingInIssueIds([]);
      }
    }
  };

  const handleConfirmDeleteIssue = async () => {
    if (deleteTargetIds.length === 0 || isDeletingIssue) {
      return;
    }

    const targetIds = [...deleteTargetIds];

    setIsDeletingIssue(true);
    setDeleteIssueError(null);

    let deletedCount = 0;
    const failedIds: number[] = [];

    for (const issueId of targetIds) {
      try {
        await onDelete(issueId);
        deletedCount += 1;
      } catch (_error) {
        failedIds.push(issueId);
      }
    }

    if (failedIds.length > 0) {
      setDeleteTargetIds(failedIds);
      setDeleteIssueError(
        deletedCount > 0
          ? `Deleted ${deletedCount} issue${deletedCount === 1 ? "" : "s"}, but ${failedIds.length} failed.`
          : "Failed to delete selected issues."
      );
    } else {
      setDeleteTargetIds([]);
    }

    const deletedIssueIds = new Set(targetIds.filter((issueId) => !failedIds.includes(issueId)));
    setSelectedIssueIds((previousIds) => previousIds.filter((issueId) => !deletedIssueIds.has(issueId)));

    setIsDeletingIssue(false);
  };

  const selectedIssueCount = selectedIssueIds.length;

  return (
    <>
      <div className="mb-2 flex items-center justify-between px-1">
        <p className="text-xs text-[hsl(var(--muted-foreground))]">
          {selectedIssueCount > 1
            ? `${selectedIssueCount} issues selected`
            : "Cmd/Ctrl+click to multi-select. Hold Shift and drag to box-select."}
        </p>
        {isBulkMoving && (
          <span className="text-xs text-emerald-300">Moving selected issues...</span>
        )}
      </div>

      {bulkActionError && (
        <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
          {bulkActionError}
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={rectIntersection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div
          ref={boardRef}
          onPointerDownCapture={handleBoardPointerDownCapture}
          className="relative"
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
                  selectedIssueIds={selectedIssueIdSet}
                  movingOutIssueIds={movingOutIssueIdSet}
                  movingInIssueIds={movingInIssueIdSet}
                  isBulkMoveTarget={
                    bulkMoveTargetStatus === status && movingInIssueIds.length > 0
                  }
                  onSelect={handleIssueSelect}
                  onIssueHover={onIssueHover}
                  onIssueContextMenu={handleIssueContextMenu}
                />
              </div>
            ))}
          </div>

          {selectionRect && (
            <div
              className="pointer-events-none fixed z-[70] rounded-md border border-sky-300/80 bg-sky-400/15 shadow-[0_0_0_1px_rgba(56,189,248,0.25)]"
              style={{
                left: `${selectionRect.left}px`,
                top: `${selectionRect.top}px`,
                width: `${selectionRect.width}px`,
                height: `${selectionRect.height}px`,
              }}
            />
          )}
        </div>

        <DragOverlay
          dropAnimation={{
            duration: 200,
            easing: "cubic-bezier(0.25, 1, 0.5, 1)",
          }}
        >
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
          data-feedback-context-menu="true"
          className="fixed z-[80] min-w-[240px] overflow-hidden rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-2xl shadow-black/40 backdrop-blur-sm"
          style={{
            left: `${contextMenuPosition.left}px`,
            top: `${contextMenuPosition.top}px`,
          }}
        >
          <div className="border-b border-[hsl(var(--border))] px-3 py-2">
            <p className="text-xs font-medium text-[hsl(var(--foreground))]">
              {contextMenuIssues.length === 1
                ? `Issue #${contextMenuIssues[0].id}`
                : `${contextMenuIssues.length} issues selected`}
            </p>
            <p className="truncate text-[11px] text-[hsl(var(--muted-foreground))]">
              {contextMenuIssues.length === 1
                ? contextMenuIssues[0].type
                : "Bulk actions"}
            </p>
          </div>

          {primaryContextMenuIssue && (
            <button
              type="button"
              role="menuitem"
              onClick={handleOpenIssueFromMenu}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-[hsl(var(--secondary))]"
            >
              <OpenIcon className="h-4 w-4" />
              Open issue
            </button>
          )}

          <div className="border-t border-[hsl(var(--border))] px-3 py-2">
            <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
              Move To
            </p>
            <div className="space-y-1">
              {STATUSES.map((status) => {
                const movableCount = contextMenuIssues.filter((issue) => issue.status !== status).length;
                const isDisabled = movableCount === 0 || isBulkMoving;

                return (
                  <button
                    key={status}
                    type="button"
                    role="menuitem"
                    disabled={isDisabled}
                    onClick={() => {
                      void handleMoveIssuesFromMenu(status);
                    }}
                    className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-[hsl(var(--secondary))] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span>{STATUS_CONFIG[status].label}</span>
                    {contextMenuIssues.length > 1 && (
                      <span className="text-[11px] text-[hsl(var(--muted-foreground))]">{movableCount}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            role="menuitem"
            onClick={handleDeleteIssueFromMenu}
            disabled={isDeletingIssue}
            className="flex w-full items-center gap-2 border-t border-[hsl(var(--border))] px-3 py-2 text-left text-sm text-red-200 transition-colors hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <TrashIcon className="h-4 w-4" />
            {contextMenuIssues.length > 1 ? `Delete ${contextMenuIssues.length} issues` : "Delete issue"}
          </button>
        </div>
      )}

      <Dialog
        open={deleteTargetIds.length > 0}
        onOpenChange={(open) => {
          if (!isDeletingIssue && !open) {
            setDeleteTargetIds([]);
            setDeleteIssueError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-300">
              <TrashIcon className="h-4 w-4" />
              {deleteTargetIds.length > 1
                ? `Delete ${deleteTargetIds.length} issues?`
                : `Delete Issue ${deleteTargetIds[0] ? `#${deleteTargetIds[0]}` : ""}?`}
            </DialogTitle>
            <DialogDescription className="pt-1">
              {deleteTargetIds.length > 1
                ? "This will permanently delete all selected issues and associated notes. This action cannot be undone."
                : "This will permanently delete this issue and all associated notes. This action cannot be undone."}
            </DialogDescription>
          </DialogHeader>

          {deleteIssueError && (
            <p className="text-sm text-red-400">{deleteIssueError}</p>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            <button
              type="button"
              onClick={() => {
                setDeleteTargetIds([]);
                setDeleteIssueError(null);
              }}
              disabled={isDeletingIssue}
              className="px-3 py-2 text-sm rounded-lg border border-[hsl(var(--border))] hover:bg-[hsl(var(--secondary))] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                void handleConfirmDeleteIssue();
              }}
              disabled={isDeletingIssue}
              className="px-3 py-2 text-sm rounded-lg border border-red-500/40 bg-red-500/20 text-red-200 hover:bg-red-500/30 transition-colors disabled:opacity-50"
            >
              {isDeletingIssue
                ? "Deleting..."
                : deleteTargetIds.length > 1
                  ? "Delete Issues"
                  : "Delete Permanently"}
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
