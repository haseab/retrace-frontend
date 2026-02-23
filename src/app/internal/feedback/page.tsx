"use client";

import { useState, useEffect, useCallback } from "react";
import { FeedbackItem, FeedbackFilters, FeedbackStatus, FeedbackPriority, ViewMode, FeedbackResponse } from "@/lib/types/feedback";
import { FiltersBar } from "@/components/admin/feedback/filters-bar";
import { KanbanBoard } from "@/components/admin/feedback/kanban-board";
import { ListView } from "@/components/admin/feedback/list-view";
import { IssueDetail } from "@/components/admin/feedback/issue-detail";

export default function FeedbackPage() {
  const [issues, setIssues] = useState<FeedbackItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState<FeedbackItem | null>(null);
  const [readIssueIds, setReadIssueIds] = useState<Set<number>>(new Set());
  const [isDetailClosing, setIsDetailClosing] = useState(false);
  const [view, setView] = useState<ViewMode>("kanban");
  const [filters, setFilters] = useState<FeedbackFilters>({
    type: "all",
    status: "all",
    priority: "all",
    search: "",
  });

  const fetchIssues = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.type && filters.type !== "all") params.set("type", filters.type);
      // Don't filter by status for kanban view - we need all statuses to show columns
      if (view === "list" && filters.status && filters.status !== "all") params.set("status", filters.status);
      if (filters.priority && filters.priority !== "all") params.set("priority", filters.priority);
      if (filters.search) params.set("search", filters.search);

      const url = `/api/feedback${params.toString() ? `?${params.toString()}` : ""}`;
      const res = await fetch(url);
      const data: FeedbackResponse = await res.json();
      setIssues(data.feedback || []);
    } catch (error) {
      console.error("Failed to fetch issues:", error);
    } finally {
      setIsLoading(false);
    }
  }, [filters, view]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

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

  const handleUpdateStatus = async (id: number, status: FeedbackStatus) => {
    // Optimistic update
    const previousIssues = [...issues];
    setIssues((prev) =>
      prev.map((issue) =>
        issue.id === id ? { ...issue, status, updatedAt: new Date().toISOString() } : issue
      )
    );

    // Update selected issue if it's the one being changed
    if (selectedIssue?.id === id) {
      setSelectedIssue((prev) => prev ? { ...prev, status, updatedAt: new Date().toISOString() } : null);
    }

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
      // Rollback on failure
      setIssues(previousIssues);
      if (selectedIssue?.id === id) {
        setSelectedIssue(previousIssues.find((i) => i.id === id) || null);
      }
    }
  };

  const handleUpdatePriority = async (id: number, priority: FeedbackPriority) => {
    // Optimistic update
    const previousIssues = [...issues];
    setIssues((prev) =>
      prev.map((issue) =>
        issue.id === id ? { ...issue, priority, updatedAt: new Date().toISOString() } : issue
      )
    );

    if (selectedIssue?.id === id) {
      setSelectedIssue((prev) => prev ? { ...prev, priority, updatedAt: new Date().toISOString() } : null);
    }

    try {
      const res = await fetch(`/api/feedback/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority }),
      });

      if (!res.ok) {
        throw new Error("Failed to update priority");
      }
    } catch (error) {
      console.error("Failed to update priority:", error);
      setIssues(previousIssues);
      if (selectedIssue?.id === id) {
        setSelectedIssue(previousIssues.find((i) => i.id === id) || null);
      }
    }
  };

  const handleUpdate = async (id: number, updates: { status?: FeedbackStatus; priority?: FeedbackPriority; notes?: string; tags?: string[] }) => {
    // Optimistic update
    const previousIssues = [...issues];
    const previousSelected = selectedIssue;

    setIssues((prev) =>
      prev.map((issue) =>
        issue.id === id ? { ...issue, ...updates, updatedAt: new Date().toISOString() } : issue
      )
    );

    if (selectedIssue?.id === id) {
      setSelectedIssue((prev) => prev ? { ...prev, ...updates, updatedAt: new Date().toISOString() } : null);
    }

    try {
      const res = await fetch(`/api/feedback/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        throw new Error("Failed to update issue");
      }
    } catch (error) {
      console.error("Failed to update issue:", error);
      setIssues(previousIssues);
      setSelectedIssue(previousSelected);
    }
  };

  const markIssueAsRead = useCallback((id: number) => {
    setReadIssueIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const handleSelectIssue = (issue: FeedbackItem) => {
    // If clicking the same card, dismiss the panel
    if (selectedIssue?.id === issue.id) {
      handleCloseDetail();
    } else {
      markIssueAsRead(issue.id);
      setSelectedIssue(issue);
    }
  };

  // Filter issues client-side for search (in addition to server-side)
  const filteredIssues = issues.filter((issue) => {
    if (filters.search && !issue.description.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    return true;
  });
  const unreadCount = filteredIssues.reduce(
    (count, issue) => count + (readIssueIds.has(issue.id) ? 0 : 1),
    0
  );

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
        onRefresh={fetchIssues}
        isLoading={isLoading}
      />

      {/* Content */}
      {isLoading && issues.length === 0 ? (
        <div className="text-center py-12 text-[hsl(var(--muted-foreground))]">
          Loading...
        </div>
      ) : (
        <div className="flex gap-6">
          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            {view === "kanban" ? (
              <KanbanBoard
                issues={filteredIssues}
                readIssueIds={readIssueIds}
                selectedId={selectedIssue?.id || null}
                onSelect={handleSelectIssue}
                onUpdateStatus={handleUpdateStatus}
              />
            ) : (
              <ListView
                issues={filteredIssues}
                selectedId={selectedIssue?.id || null}
                onSelect={handleSelectIssue}
                onUpdateStatus={handleUpdateStatus}
                onUpdatePriority={handleUpdatePriority}
              />
            )}

            {filteredIssues.length === 0 && !isLoading && (
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
