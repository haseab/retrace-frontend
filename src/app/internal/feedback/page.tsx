"use client";

import { useState, useEffect, useCallback, useRef, type MouseEvent as ReactMouseEvent } from "react";
import {
  FeedbackItem,
  FeedbackFilters,
  FeedbackStatus,
  FeedbackPriority,
  ViewMode,
  FeedbackResponse,
  FeedbackSummaryItem,
  hydrateFeedbackSummary,
} from "@/lib/types/feedback";
import { FiltersBar } from "@/components/admin/feedback/filters-bar";
import { KanbanBoard } from "@/components/admin/feedback/kanban-board";
import { ListView } from "@/components/admin/feedback/list-view";
import { IssueDetail } from "@/components/admin/feedback/issue-detail";
import { CreateIssueForm } from "@/components/admin/feedback/create-issue-form";
import { authFetch } from "@/lib/client-api";

const KANBAN_STATUSES: FeedbackStatus[] = ["open", "in_progress", "to_notify", "notified", "resolved", "closed", "back_burner"];
const KANBAN_PAGE_SIZE = 10;
const LIST_PAGE_SIZE = 30;
const MIN_DETAIL_PANEL_WIDTH = 400;
const DETAIL_PANEL_WIDTH_STORAGE_KEY = "internal_feedback_detail_panel_width_v1";

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
    notified: [],
    resolved: [],
    closed: [],
    back_burner: [],
  };
}

function createEmptyColumnPagination(): Record<FeedbackStatus, ColumnPaginationState> {
  return {
    open: { hasMore: false, isLoading: false },
    in_progress: { hasMore: false, isLoading: false },
    to_notify: { hasMore: false, isLoading: false },
    notified: { hasMore: false, isLoading: false },
    resolved: { hasMore: false, isLoading: false },
    closed: { hasMore: false, isLoading: false },
    back_burner: { hasMore: false, isLoading: false },
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

function hydrateFeedbackItems(items: FeedbackSummaryItem[]): FeedbackItem[] {
  return items.map((item) => hydrateFeedbackSummary(item));
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
  const [issueDetailsById, setIssueDetailsById] = useState<Record<number, FeedbackItem>>({});
  const [detailLoadingIssueId, setDetailLoadingIssueId] = useState<number | null>(null);
  const [logsLoadingIssueId, setLogsLoadingIssueId] = useState<number | null>(null);
  const [isDetailClosing, setIsDetailClosing] = useState(false);
  const [detailPanelWidth, setDetailPanelWidth] = useState(MIN_DETAIL_PANEL_WIDTH);
  const [view, setView] = useState<ViewMode>("kanban");
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
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
    notified: false,
    resolved: false,
    closed: false,
    back_burner: false,
  });
  const statusMutationVersionRef = useRef<Record<number, number>>({});
  const detailResizeStateRef = useRef<{ startX: number; startWidth: number } | null>(null);
  const detailPanelRef = useRef<HTMLDivElement | null>(null);
  const detailPrefetchPromisesRef = useRef<Map<number, Promise<FeedbackItem>>>(new Map());
  const logsFetchPromisesRef = useRef<Map<number, Promise<FeedbackItem>>>(new Map());
  const detailLoadedRef = useRef<Set<number>>(new Set());
  const recentLogsLoadedRef = useRef<Set<number>>(new Set());
  const hasSkippedInitialDetailPersistRef = useRef(false);

  const getMaxDetailPanelWidth = useCallback(() => {
    if (typeof window === "undefined") {
      return 960;
    }

    // Keep enough horizontal room for board/list content while allowing wider detail views.
    return Math.max(MIN_DETAIL_PANEL_WIDTH, Math.floor(window.innerWidth - 360));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    let savedWidth: number;
    try {
      savedWidth = Number(window.localStorage.getItem(DETAIL_PANEL_WIDTH_STORAGE_KEY));
    } catch {
      return;
    }

    if (!Number.isFinite(savedWidth)) {
      return;
    }

    const clampedWidth = Math.max(
      MIN_DETAIL_PANEL_WIDTH,
      Math.min(getMaxDetailPanelWidth(), Math.round(savedWidth))
    );
    setDetailPanelWidth(clampedWidth);
  }, [getMaxDetailPanelWidth]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    // Avoid clobbering restored widths with the initial default on mount.
    if (!hasSkippedInitialDetailPersistRef.current) {
      hasSkippedInitialDetailPersistRef.current = true;
      return;
    }

    try {
      window.localStorage.setItem(DETAIL_PANEL_WIDTH_STORAGE_KEY, String(Math.round(detailPanelWidth)));
    } catch {
      // Ignore storage write failures (e.g., strict privacy mode).
    }
  }, [detailPanelWidth]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleWindowResize = () => {
      const maxWidth = getMaxDetailPanelWidth();
      setDetailPanelWidth((prev) => Math.max(MIN_DETAIL_PANEL_WIDTH, Math.min(prev, maxWidth)));
    };

    window.addEventListener("resize", handleWindowResize);
    return () => window.removeEventListener("resize", handleWindowResize);
  }, [getMaxDetailPanelWidth]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!detailResizeStateRef.current) {
        return;
      }

      const { startX, startWidth } = detailResizeStateRef.current;
      const delta = startX - event.clientX;
      const nextWidth = Math.max(
        MIN_DETAIL_PANEL_WIDTH,
        Math.min(getMaxDetailPanelWidth(), Math.round(startWidth + delta))
      );
      setDetailPanelWidth(nextWidth);
    };

    const stopResize = () => {
      if (!detailResizeStateRef.current) {
        return;
      }
      detailResizeStateRef.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", stopResize);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", stopResize);
      if (detailResizeStateRef.current) {
        detailResizeStateRef.current = null;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };
  }, [getMaxDetailPanelWidth]);

  const handleStartDetailResize = useCallback((event: ReactMouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    detailResizeStateRef.current = {
      startX: event.clientX,
      startWidth: detailPanelWidth,
    };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [detailPanelWidth]);

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
    const res = await authFetch(url);

    if (!res.ok) {
      throw new Error(`Failed to fetch feedback: ${res.status}`);
    }

    const data: FeedbackResponse = await res.json();
    return data;
  }, [filters]);

  const mergeIssueDetail = useCallback((incoming: FeedbackItem, options: { includeRecentLogs: boolean }) => {
    const { includeRecentLogs } = options;

    setIssueDetailsById((prev) => {
      const existing = prev[incoming.id];
      const shouldPreserveExistingLogs = Boolean(existing && !includeRecentLogs && recentLogsLoadedRef.current.has(incoming.id));
      const recentLogs = shouldPreserveExistingLogs ? existing.recentLogs : incoming.recentLogs;
      const recentErrors = existing && !includeRecentLogs && incoming.recentErrors.length === 0
        ? existing.recentErrors
        : incoming.recentErrors;

      const merged: FeedbackItem = {
        ...(existing ?? incoming),
        ...incoming,
        recentLogs,
        recentErrors,
      };

      return {
        ...prev,
        [incoming.id]: merged,
      };
    });

    setSelectedIssue((prev) => {
      if (!prev || prev.id !== incoming.id) {
        return prev;
      }

      const shouldPreserveSelectedLogs = !includeRecentLogs && recentLogsLoadedRef.current.has(incoming.id);
      const recentLogs = shouldPreserveSelectedLogs ? prev.recentLogs : incoming.recentLogs;
      const recentErrors = !includeRecentLogs && incoming.recentErrors.length === 0
        ? prev.recentErrors
        : incoming.recentErrors;

      return {
        ...prev,
        ...incoming,
        recentLogs,
        recentErrors,
      };
    });
  }, []);

  const fetchIssueDetail = useCallback(async (id: number, includeRecentLogs: boolean): Promise<FeedbackItem> => {
    const params = new URLSearchParams();
    if (includeRecentLogs) {
      params.set("includeRecentLogs", "true");
    }

    const query = params.toString();
    const url = query.length > 0
      ? `/api/feedback/${id}?${query}`
      : `/api/feedback/${id}`;

    const res = await authFetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch issue detail ${id}: ${res.status}`);
    }

    const data = await res.json() as { feedback?: FeedbackItem };
    if (!data.feedback) {
      throw new Error(`Missing issue detail payload for issue ${id}`);
    }

    return data.feedback;
  }, []);

  const fetchAndCacheIssueDetail = useCallback((id: number, includeRecentLogs: boolean): Promise<FeedbackItem> => {
    const promiseMap = includeRecentLogs ? logsFetchPromisesRef.current : detailPrefetchPromisesRef.current;
    const existingPromise = promiseMap.get(id);
    if (existingPromise) {
      return existingPromise;
    }

    const promise = (async () => {
      const detail = await fetchIssueDetail(id, includeRecentLogs);
      mergeIssueDetail(detail, { includeRecentLogs });
      detailLoadedRef.current.add(id);
      if (includeRecentLogs) {
        recentLogsLoadedRef.current.add(id);
      }
      return detail;
    })().finally(() => {
      promiseMap.delete(id);
    });

    promiseMap.set(id, promise);
    return promise;
  }, [fetchIssueDetail, mergeIssueDetail]);

  const prefetchIssueDetailOnHover = useCallback((id: number) => {
    if (detailLoadedRef.current.has(id) || recentLogsLoadedRef.current.has(id)) {
      return;
    }

    void fetchAndCacheIssueDetail(id, false).catch((error) => {
      console.error(`Failed to prefetch issue detail for ${id}:`, error);
    });
  }, [fetchAndCacheIssueDetail]);

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

      setListIssues(hydrateFeedbackItems(data.feedback || []));
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

      setListIssues((prev) => appendUniqueIssues(prev, hydrateFeedbackItems(data.feedback || [])));
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
      notified: false,
      resolved: false,
      closed: false,
      back_burner: false,
    };

    setIsKanbanLoading(true);
    setKanbanIssuesByStatus(createEmptyIssuesByStatus());
    setKanbanPagination({
      open: { hasMore: false, isLoading: true },
      in_progress: { hasMore: false, isLoading: true },
      to_notify: { hasMore: false, isLoading: true },
      notified: { hasMore: false, isLoading: true },
      resolved: { hasMore: false, isLoading: true },
      closed: { hasMore: false, isLoading: true },
      back_burner: { hasMore: false, isLoading: true },
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
              [status]: hydrateFeedbackItems(data.feedback || []),
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
        [status]: appendUniqueIssues(prev[status], hydrateFeedbackItems(data.feedback || [])),
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
    setDetailLoadingIssueId(null);
    setLogsLoadingIssueId(null);
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

  const handleIssueCreated = useCallback(async () => {
    setSelectedIssue(null);
    setIsCreateFormOpen(false);

    if (view === "list") {
      await loadInitialList();
      return;
    }

    await loadInitialKanban();
  }, [view, loadInitialKanban, loadInitialList]);

  const handleCloseDetail = useCallback(() => {
    if (selectedIssue && !isDetailClosing) {
      const closingIssueId = selectedIssue.id;
      setIsDetailClosing(true);
      setTimeout(() => {
        setDetailLoadingIssueId((prev) => (prev === closingIssueId ? null : prev));
        setLogsLoadingIssueId((prev) => (prev === closingIssueId ? null : prev));
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

  // Dismiss detail panel when clicking outside of it.
  useEffect(() => {
    if (!selectedIssue) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      if (detailPanelRef.current?.contains(target)) {
        return;
      }

      if (target instanceof Element && target.closest("[data-feedback-select-trigger=\"true\"]")) {
        return;
      }

      handleCloseDetail();
    };

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
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
        notified: prev.notified.map((issue) => (issue.id === id ? { ...issue, ...patch } : issue)),
        resolved: prev.resolved.map((issue) => (issue.id === id ? { ...issue, ...patch } : issue)),
        closed: prev.closed.map((issue) => (issue.id === id ? { ...issue, ...patch } : issue)),
        back_burner: prev.back_burner.map((issue) => (issue.id === id ? { ...issue, ...patch } : issue)),
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

    setIssueDetailsById((prev) => {
      if (!prev[id]) {
        return prev;
      }

      return {
        ...prev,
        [id]: { ...prev[id], ...patch },
      };
    });

    setSelectedIssue((prev) => (
      prev && prev.id === id ? { ...prev, ...patch } : prev
    ));
  }, [filters.status, view]);

  const removeIssueLocally = useCallback((id: number) => {
    setListIssues((prev) => prev.filter((issue) => issue.id !== id));

    setKanbanIssuesByStatus((prev) => ({
      open: prev.open.filter((issue) => issue.id !== id),
      in_progress: prev.in_progress.filter((issue) => issue.id !== id),
      to_notify: prev.to_notify.filter((issue) => issue.id !== id),
      notified: prev.notified.filter((issue) => issue.id !== id),
      resolved: prev.resolved.filter((issue) => issue.id !== id),
      closed: prev.closed.filter((issue) => issue.id !== id),
      back_burner: prev.back_burner.filter((issue) => issue.id !== id),
    }));

    setIssueDetailsById((prev) => {
      if (!prev[id]) {
        return prev;
      }

      const next = { ...prev };
      delete next[id];
      return next;
    });

    detailLoadedRef.current.delete(id);
    recentLogsLoadedRef.current.delete(id);
    detailPrefetchPromisesRef.current.delete(id);
    logsFetchPromisesRef.current.delete(id);

    setSelectedIssue((prev) => (prev?.id === id ? null : prev));
  }, []);

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
      const res = await authFetch(`/api/feedback/${id}`, {
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
      const res = await authFetch(`/api/feedback/${id}`, {
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
      const res = await authFetch(`/api/feedback/${id}`, {
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

  const handleDeleteIssue = async (id: number) => {
    const res = await authFetch(`/api/feedback/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      throw new Error("Failed to delete issue");
    }

    removeIssueLocally(id);
  };

  const markIssueAsRead = useCallback(async (id: number) => {
    try {
      const res = await authFetch(`/api/feedback/${id}`, {
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

  const handleSelectIssue = useCallback((issue: FeedbackItem) => {
    // If clicking the same card, dismiss the panel
    if (selectedIssue?.id === issue.id) {
      handleCloseDetail();
      return;
    }

    const cachedIssue = issueDetailsById[issue.id];
    const mergedIssue = cachedIssue ? { ...issue, ...cachedIssue } : issue;

    if (!mergedIssue.isRead) {
      applyIssuePatchLocally(issue.id, { isRead: true });
      void markIssueAsRead(issue.id);
    }

    setSelectedIssue(mergedIssue.isRead ? mergedIssue : { ...mergedIssue, isRead: true });

    if (!detailLoadedRef.current.has(issue.id) && !recentLogsLoadedRef.current.has(issue.id)) {
      setDetailLoadingIssueId(issue.id);
      void fetchAndCacheIssueDetail(issue.id, false)
        .catch((error) => {
          console.error(`Failed to load issue detail for ${issue.id}:`, error);
        })
        .finally(() => {
          setDetailLoadingIssueId((prev) => (prev === issue.id ? null : prev));
        });
    }
  }, [
    selectedIssue?.id,
    handleCloseDetail,
    issueDetailsById,
    applyIssuePatchLocally,
    markIssueAsRead,
    fetchAndCacheIssueDetail,
  ]);

  const handleLoadRecentLogs = useCallback(async (id: number) => {
    if (recentLogsLoadedRef.current.has(id)) {
      return;
    }

    setLogsLoadingIssueId(id);
    try {
      await fetchAndCacheIssueDetail(id, true);
    } catch (error) {
      console.error(`Failed to load recent logs for issue ${id}:`, error);
    } finally {
      setLogsLoadingIssueId((prev) => (prev === id ? null : prev));
    }
  }, [fetchAndCacheIssueDetail]);

  const selectedIssueDetail = selectedIssue ? issueDetailsById[selectedIssue.id] : null;
  const resolvedSelectedIssue = selectedIssue && selectedIssueDetail
    ? { ...selectedIssue, ...selectedIssueDetail }
    : selectedIssue;
  const selectedIssueId = resolvedSelectedIssue?.id ?? null;
  const isSelectedIssueDetailLoading = selectedIssueId !== null && detailLoadingIssueId === selectedIssueId;
  const isSelectedIssueLogsLoading = selectedIssueId !== null && logsLoadingIssueId === selectedIssueId;
  const hasSelectedIssueRecentLogs = selectedIssueId !== null && recentLogsLoadedRef.current.has(selectedIssueId);

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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Feedback & Issues</h1>
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full border border-sky-400/40 bg-sky-500/10 text-sky-300">
              {unreadCount} unread
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsCreateFormOpen((prev) => !prev)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <PlusIcon className="w-4 h-4" />
            {isCreateFormOpen ? "Close Form" : "New Issue"}
          </button>
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

      {isCreateFormOpen && (
        <div className="mb-6">
          <CreateIssueForm
            onCreated={handleIssueCreated}
            onCancel={() => setIsCreateFormOpen(false)}
          />
        </div>
      )}

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
                  notified: kanbanPagination.notified.hasMore,
                  resolved: kanbanPagination.resolved.hasMore,
                  closed: kanbanPagination.closed.hasMore,
                  back_burner: kanbanPagination.back_burner.hasMore,
                }}
                isLoadingByStatus={{
                  open: kanbanPagination.open.isLoading,
                  in_progress: kanbanPagination.in_progress.isLoading,
                  to_notify: kanbanPagination.to_notify.isLoading,
                  notified: kanbanPagination.notified.isLoading,
                  resolved: kanbanPagination.resolved.isLoading,
                  closed: kanbanPagination.closed.isLoading,
                  back_burner: kanbanPagination.back_burner.isLoading,
                }}
                selectedId={selectedIssue?.id || null}
                onSelect={handleSelectIssue}
                onUpdateStatus={handleUpdateStatus}
                onLoadMore={loadMoreKanbanStatus}
                onIssueHover={prefetchIssueDetailOnHover}
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
                onIssueHover={prefetchIssueDetailOnHover}
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
            <div
              ref={detailPanelRef}
              className={`relative shrink-0 ${isDetailClosing ? "animate-slide-out-right" : "animate-slide-in-right"}`}
              style={{ width: `${detailPanelWidth}px`, minWidth: `${MIN_DETAIL_PANEL_WIDTH}px` }}
            >
              <button
                type="button"
                onMouseDown={handleStartDetailResize}
                onDoubleClick={() => setDetailPanelWidth(MIN_DETAIL_PANEL_WIDTH)}
                className="absolute -left-3 top-0 h-full w-3 cursor-col-resize group z-10"
                aria-label="Resize detail panel"
                title="Drag to resize (double-click to reset)"
              >
                <span className="absolute left-1/2 top-1/2 h-16 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[hsl(var(--border))] group-hover:bg-[hsl(var(--primary))] transition-colors" />
              </button>
              <div className="sticky top-8">
                <IssueDetail
                  issue={resolvedSelectedIssue}
                  onClose={handleCloseDetail}
                  onUpdate={handleUpdate}
                  onDelete={handleDeleteIssue}
                  onLoadRecentLogs={handleLoadRecentLogs}
                  isLoadingRecentLogs={isSelectedIssueLogsLoading}
                  hasLoadedRecentLogs={hasSelectedIssueRecentLogs}
                  isLoadingDetail={isSelectedIssueDetailLoading}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
