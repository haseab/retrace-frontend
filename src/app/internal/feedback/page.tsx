"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { FeedbackItem, FeedbackFilters, FeedbackStatus, FeedbackPriority, ViewMode, FeedbackResponse } from "@/lib/types/feedback";
import { FiltersBar } from "@/components/admin/feedback/filters-bar";
import { KanbanBoard } from "@/components/admin/feedback/kanban-board";
import { ListView } from "@/components/admin/feedback/list-view";
import { IssueDetail } from "@/components/admin/feedback/issue-detail";

const KANBAN_STATUSES: FeedbackStatus[] = ["open", "in_progress", "to_notify", "resolved", "closed"];
const KANBAN_PAGE_SIZE = 10;
const LIST_PAGE_SIZE = 30;

interface ColumnPaginationState {
  hasMore: boolean;
  isLoading: boolean;
}

interface FetchFeedbackPageOptions {
  limit: number;
  offset: number;
  status?: FeedbackStatus;
  includeListStatusFilter?: boolean;
}

function createEmptyIssuesByStatus(): Record<FeedbackStatus, FeedbackItem[]> {
  return {
    open: [],
    in_progress: [],
    to_notify: [],
    resolved: [],
    closed: [],
  };
}

function createEmptyColumnPagination(): Record<FeedbackStatus, ColumnPaginationState> {
  return {
    open: { hasMore: false, isLoading: false },
    in_progress: { hasMore: false, isLoading: false },
    to_notify: { hasMore: false, isLoading: false },
    resolved: { hasMore: false, isLoading: false },
    closed: { hasMore: false, isLoading: false },
  };
}

function appendUniqueIssues(existing: FeedbackItem[], incoming: FeedbackItem[]): FeedbackItem[] {
  if (incoming.length === 0) {
    return existing;
  }

  const seen = new Set(existing.map((issue) => issue.id));
  const nextItems = incoming.filter((issue) => !seen.has(issue.id));
  if (nextItems.length === 0) {
    return existing;
  }

  return [...existing, ...nextItems];
}

export default function FeedbackPage() {
  const [listIssues, setListIssues] = useState<FeedbackItem[]>([]);
  const [isListLoading, setIsListLoading] = useState(true);
  const [isListLoadingMore, setIsListLoadingMore] = useState(false);
  const [listHasMore, setListHasMore] = useState(false);

  const [kanbanIssuesByStatus, setKanbanIssuesByStatus] = useState<Record<FeedbackStatus, FeedbackItem[]>>(
    createEmptyIssuesByStatus()
  );
  const [kanbanPagination, setKanbanPagination] = useState<Record<FeedbackStatus, ColumnPaginationState>>(
    createEmptyColumnPagination()
  );
  const [isKanbanLoading, setIsKanbanLoading] = useState(true);

  const [selectedIssue, setSelectedIssue] = useState<FeedbackItem | null>(null);
  const [isDetailClosing, setIsDetailClosing] = useState(false);
  const [view, setView] = useState<ViewMode>("kanban");
  const [filters, setFilters] = useState<FeedbackFilters>({
    type: "all",
    status: "all",
    priority: "all",
    search: "",
  });

  const activeQueryRef = useRef(0);
  const listLoadMoreInFlightRef = useRef(false);
  const kanbanLoadMoreInFlightRef = useRef<Record<FeedbackStatus, boolean>>({
    open: false,
    in_progress: false,
    to_notify: false,
    resolved: false,
    closed: false,
  });
  const statusMutationVersionRef = useRef<Record<number, number>>({});

  const fetchFeedbackPage = useCallback(async ({
    limit,
    offset,
    status,
    includeListStatusFilter = false,
  }: FetchFeedbackPageOptions): Promise<FeedbackResponse> => {
    const params = new URLSearchParams();

    if (filters.type && filters.type !== "all") {
      params.set("type", filters.type);
    }

    if (status) {
      params.set("status", status);
    } else if (includeListStatusFilter && filters.status && filters.status !== "all") {
      params.set("status", filters.status);
    }

    if (filters.priority && filters.priority !== "all") {
      params.set("priority", filters.priority);
    }

    const search = filters.search?.trim();
    if (search) {
      params.set("search", search);
    }

    params.set("limit", limit.toString());
    params.set("offset", offset.toString());

    const url = `/api/feedback?${params.toString()}`;
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`Failed to fetch feedback: ${res.status}`);
    }

    const data: FeedbackResponse = await res.json();
    return data;
  }, [filters]);

  const loadInitialList = useCallback(async () => {
    const queryToken = ++activeQueryRef.current;
    listLoadMoreInFlightRef.current = false;

    setIsListLoading(true);
    setIsListLoadingMore(false);
    setListIssues([]);
    setListHasMore(false);

    try {
      const data = await fetchFeedbackPage({
        limit: LIST_PAGE_SIZE,
        offset: 0,
        includeListStatusFilter: true,
      });
      if (queryToken !== activeQueryRef.current) {
        return;
      }

      setListIssues(data.feedback || []);
      setListHasMore(data.hasMore);
    } catch (error) {
      console.error("Failed to fetch list issues:", error);
    } finally {
      if (queryToken === activeQueryRef.current) {
        setIsListLoading(false);
      }
    }
  }, [fetchFeedbackPage]);

  const loadMoreList = useCallback(async () => {
    if (isListLoading || isListLoadingMore || !listHasMore || listLoadMoreInFlightRef.current) {
      return;
    }

    const queryToken = activeQueryRef.current;
    const offset = listIssues.length;
    listLoadMoreInFlightRef.current = true;
    setIsListLoadingMore(true);

    try {
      const data = await fetchFeedbackPage({
        limit: LIST_PAGE_SIZE,
        offset,
        includeListStatusFilter: true,
      });
      if (queryToken !== activeQueryRef.current) {
        return;
      }

      setListIssues((prev) => appendUniqueIssues(prev, data.feedback || []));
      setListHasMore(data.hasMore);
    } catch (error) {
      console.error("Failed to load more list issues:", error);
    } finally {
      if (queryToken === activeQueryRef.current) {
        setIsListLoadingMore(false);
      }
      listLoadMoreInFlightRef.current = false;
    }
  }, [fetchFeedbackPage, isListLoading, isListLoadingMore, listHasMore, listIssues.length]);

  const loadInitialKanban = useCallback(async () => {
    const queryToken = ++activeQueryRef.current;
    kanbanLoadMoreInFlightRef.current = {
      open: false,
      in_progress: false,
      to_notify: false,
      resolved: false,
      closed: false,
    };

    setIsKanbanLoading(true);
    setKanbanIssuesByStatus(createEmptyIssuesByStatus());
    setKanbanPagination({
      open: { hasMore: false, isLoading: true },
      in_progress: { hasMore: false, isLoading: true },
      to_notify: { hasMore: false, isLoading: true },
      resolved: { hasMore: false, isLoading: true },
      closed: { hasMore: false, isLoading: true },
    });

    try {
      await Promise.all(
        KANBAN_STATUSES.map(async (status) => {
          try {
            const data = await fetchFeedbackPage({
              limit: KANBAN_PAGE_SIZE,
              offset: 0,
              status,
            });
            if (queryToken !== activeQueryRef.current) {
              return;
            }

            setKanbanIssuesByStatus((prev) => ({
              ...prev,
              [status]: data.feedback || [],
            }));
            setKanbanPagination((prev) => ({
              ...prev,
              [status]: {
                hasMore: data.hasMore,
                isLoading: false,
              },
            }));
          } catch (error) {
            console.error(`Failed to fetch kanban status "${status}":`, error);
            if (queryToken !== activeQueryRef.current) {
              return;
            }

            setKanbanPagination((prev) => ({
              ...prev,
              [status]: {
                hasMore: false,
                isLoading: false,
              },
            }));
          }
        })
      );
    } finally {
      if (queryToken === activeQueryRef.current) {
        setIsKanbanLoading(false);
      }
    }
  }, [fetchFeedbackPage]);

  const loadMoreKanbanStatus = useCallback(async (status: FeedbackStatus) => {
    const statusState = kanbanPagination[status];
    if (!statusState || isKanbanLoading || statusState.isLoading || !statusState.hasMore || kanbanLoadMoreInFlightRef.current[status]) {
      return;
    }

    const queryToken = activeQueryRef.current;
    const offset = kanbanIssuesByStatus[status].length;

    kanbanLoadMoreInFlightRef.current[status] = true;
    setKanbanPagination((prev) => ({
      ...prev,
      [status]: {
        ...prev[status],
        isLoading: true,
      },
    }));

    try {
      const data = await fetchFeedbackPage({
        limit: KANBAN_PAGE_SIZE,
        offset,
        status,
      });
      if (queryToken !== activeQueryRef.current) {
        return;
      }

      setKanbanIssuesByStatus((prev) => ({
        ...prev,
        [status]: appendUniqueIssues(prev[status], data.feedback || []),
      }));
      setKanbanPagination((prev) => ({
        ...prev,
        [status]: {
          hasMore: data.hasMore,
          isLoading: false,
        },
      }));
    } catch (error) {
      console.error(`Failed to load more "${status}" issues:`, error);
      if (queryToken === activeQueryRef.current) {
        setKanbanPagination((prev) => ({
          ...prev,
          [status]: {
            ...prev[status],
            isLoading: false,
          },
        }));
      }
    } finally {
      kanbanLoadMoreInFlightRef.current[status] = false;
    }
  }, [fetchFeedbackPage, isKanbanLoading, kanbanIssuesByStatus, kanbanPagination]);

  useEffect(() => {
    setSelectedIssue(null);
    if (view === "list") {
      void loadInitialList();
      return;
    }

    void loadInitialKanban();
  }, [filters, view, loadInitialKanban, loadInitialList]);

  const handleRefresh = useCallback(() => {
    if (view === "list") {
      void loadInitialList();
      return;
    }

    void loadInitialKanban();
  }, [view, loadInitialKanban, loadInitialList]);

  const handleCloseDetail = useCallback(() => {
    if (selectedIssue && !isDetailClosing) {
      setIsDetailClosing(true);
      setTimeout(() => {
        setSelectedIssue(null);
        setIsDetailClosing(false);
      }, 200); // Match animation duration
    }
  }, [selectedIssue, isDetailClosing]);

  // Handle escape key to close detail panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedIssue) {
        handleCloseDetail();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIssue, handleCloseDetail]);

  const applyIssuePatchLocally = useCallback((id: number, patch: Partial<FeedbackItem>) => {
    setListIssues((prev) => {
      const next = prev.map((issue) =>
        issue.id === id ? { ...issue, ...patch } : issue
      );

      if (view === "list" && patch.status && filters.status && filters.status !== "all") {
        return next.filter((issue) => issue.status === filters.status);
      }

      return next;
    });

    setKanbanIssuesByStatus((prev) => {
      const next: Record<FeedbackStatus, FeedbackItem[]> = {
        open: prev.open.map((issue) => (issue.id === id ? { ...issue, ...patch } : issue)),
        in_progress: prev.in_progress.map((issue) => (issue.id === id ? { ...issue, ...patch } : issue)),
        to_notify: prev.to_notify.map((issue) => (issue.id === id ? { ...issue, ...patch } : issue)),
        resolved: prev.resolved.map((issue) => (issue.id === id ? { ...issue, ...patch } : issue)),
        closed: prev.closed.map((issue) => (issue.id === id ? { ...issue, ...patch } : issue)),
      };

      if (!patch.status) {
        return next;
      }

      const targetStatus = patch.status;
      const sourceStatus = KANBAN_STATUSES.find((status) =>
        prev[status].some((issue) => issue.id === id)
      );

      if (!sourceStatus || sourceStatus === targetStatus) {
        return next;
      }

      const sourceIssue = prev[sourceStatus].find((issue) => issue.id === id);
      if (!sourceIssue) {
        return next;
      }

      const movedIssue: FeedbackItem = {
        ...sourceIssue,
        ...patch,
        status: targetStatus,
      };

      next[sourceStatus] = next[sourceStatus].filter((issue) => issue.id !== id);
      next[targetStatus] = [movedIssue, ...next[targetStatus].filter((issue) => issue.id !== id)];
      return next;
    });

    setSelectedIssue((prev) => (
      prev && prev.id === id ? { ...prev, ...patch } : prev
    ));
  }, [filters.status, view]);

  const handleUpdateStatus = async (id: number, status: FeedbackStatus) => {
    const previousIssueFromKanban = KANBAN_STATUSES.reduce<FeedbackItem | null>((found, columnStatus) => {
      if (found) {
        return found;
      }
      return kanbanIssuesByStatus[columnStatus].find((issue) => issue.id === id) ?? null;
    }, null);
    const previousIssue = selectedIssue?.id === id
      ? selectedIssue
      : (listIssues.find((issue) => issue.id === id) ?? previousIssueFromKanban);

    if (previousIssue?.status === status) {
      return;
    }

    const mutationVersion = (statusMutationVersionRef.current[id] ?? 0) + 1;
    statusMutationVersionRef.current[id] = mutationVersion;

    applyIssuePatchLocally(id, {
      status,
      updatedAt: new Date().toISOString(),
    });

    try {
      const res = await fetch(`/api/feedback/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        throw new Error("Failed to update status");
      }
    } catch (error) {
      console.error("Failed to update status:", error);
      if (previousIssue && statusMutationVersionRef.current[id] === mutationVersion) {
        applyIssuePatchLocally(id, {
          status: previousIssue.status,
          updatedAt: previousIssue.updatedAt,
        });
      }
    }
  };

  const handleUpdatePriority = async (id: number, priority: FeedbackPriority) => {
    try {
      const res = await fetch(`/api/feedback/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority }),
      });

      if (!res.ok) {
        throw new Error("Failed to update priority");
      }

      applyIssuePatchLocally(id, {
        priority,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Failed to update priority:", error);
    }
  };

  const handleUpdate = async (id: number, updates: { status?: FeedbackStatus; priority?: FeedbackPriority; notes?: string; tags?: string[] }) => {
    try {
      const res = await fetch(`/api/feedback/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        throw new Error("Failed to update issue");
      }

      applyIssuePatchLocally(id, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Failed to update issue:", error);
    }
  };

  const markIssueAsRead = useCallback(async (id: number) => {
    try {
      const res = await fetch(`/api/feedback/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: true }),
      });

      if (!res.ok) {
        throw new Error("Failed to mark issue as read");
      }
    } catch (error) {
      console.error("Failed to mark issue as read:", error);
    }
  }, []);

  const handleSelectIssue = (issue: FeedbackItem) => {
    // If clicking the same card, dismiss the panel
    if (selectedIssue?.id === issue.id) {
      handleCloseDetail();
    } else {
      if (!issue.isRead) {
        applyIssuePatchLocally(issue.id, { isRead: true });
        void markIssueAsRead(issue.id);
      }
      setSelectedIssue(issue.isRead ? issue : { ...issue, isRead: true });
    }
  };

  const currentIssues = view === "list"
    ? listIssues
    : KANBAN_STATUSES.flatMap((status) => kanbanIssuesByStatus[status]);
  const unreadCount = currentIssues.reduce(
    (count, issue) => count + (issue.isRead ? 0 : 1),
    0
  );
  const isLoading = view === "list" ? isListLoading : isKanbanLoading;
  const isRefreshBusy = view === "list"
    ? isListLoading || isListLoadingMore
    : isKanbanLoading;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <MessageSquareIcon className="w-7 h-7 text-[hsl(var(--primary))]" />
            Feedback & Issues
          </h1>
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full border border-sky-400/40 bg-sky-500/10 text-sky-300">
            {unreadCount} unread
          </span>
        </div>
        <p className="text-[hsl(var(--muted-foreground))] mt-1 ml-10">
          Track and manage bug reports, feature requests, and questions
        </p>
      </div>

      {/* Filters */}
      <FiltersBar
        filters={filters}
        onFiltersChange={setFilters}
        view={view}
        onViewChange={setView}
        onRefresh={handleRefresh}
        isLoading={isRefreshBusy}
      />

      {/* Content */}
      {isLoading && currentIssues.length === 0 ? (
        <div className="text-center py-12 text-[hsl(var(--muted-foreground))]">
          Loading...
        </div>
      ) : (
        <div className="flex gap-6">
          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            {view === "kanban" ? (
              <KanbanBoard
                issuesByStatus={kanbanIssuesByStatus}
                hasMoreByStatus={{
                  open: kanbanPagination.open.hasMore,
                  in_progress: kanbanPagination.in_progress.hasMore,
                  to_notify: kanbanPagination.to_notify.hasMore,
                  resolved: kanbanPagination.resolved.hasMore,
                  closed: kanbanPagination.closed.hasMore,
                }}
                isLoadingByStatus={{
                  open: kanbanPagination.open.isLoading,
                  in_progress: kanbanPagination.in_progress.isLoading,
                  to_notify: kanbanPagination.to_notify.isLoading,
                  resolved: kanbanPagination.resolved.isLoading,
                  closed: kanbanPagination.closed.isLoading,
                }}
                selectedId={selectedIssue?.id || null}
                onSelect={handleSelectIssue}
                onUpdateStatus={handleUpdateStatus}
                onLoadMore={loadMoreKanbanStatus}
              />
            ) : (
              <ListView
                issues={listIssues}
                hasMore={listHasMore}
                isLoadingMore={isListLoadingMore}
                selectedId={selectedIssue?.id || null}
                onSelect={handleSelectIssue}
                onUpdateStatus={handleUpdateStatus}
                onUpdatePriority={handleUpdatePriority}
                onLoadMore={loadMoreList}
              />
            )}

            {currentIssues.length === 0 && !isLoading && (
              <div className="text-center py-12 text-[hsl(var(--muted-foreground))]">
                No issues found matching your filters
              </div>
            )}
          </div>

          {/* Detail Panel - only show when issue is selected */}
          {selectedIssue && (
            <div className={`w-[400px] shrink-0 ${isDetailClosing ? "animate-slide-out-right" : "animate-slide-in-right"}`}>
              <div className="sticky top-8">
                <IssueDetail
                  issue={selectedIssue}
                  onClose={handleCloseDetail}
                  onUpdate={handleUpdate}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MessageSquareIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
