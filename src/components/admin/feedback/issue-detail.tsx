"use client";

import { useState, useEffect, useRef } from "react";
import { FeedbackItem, FeedbackStatus, FeedbackPriority, FeedbackNote, STATUS_CONFIG, PRIORITY_CONFIG, SOURCE_CONFIG, TYPE_CONFIG } from "@/lib/types/feedback";
import { authFetch } from "@/lib/client-api";
import { getDisplayDescription } from "@/lib/feedback-display";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface IssueDetailProps {
  issue: FeedbackItem | null;
  onClose: () => void;
  onUpdate: (id: number, updates: { status?: FeedbackStatus; priority?: FeedbackPriority; tags?: string[] }) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onLoadRecentLogs: (id: number) => Promise<void>;
  isLoadingRecentLogs?: boolean;
  hasLoadedRecentLogs?: boolean;
  isLoadingDetail?: boolean;
}

export function IssueDetail({
  issue,
  onClose,
  onUpdate,
  onDelete,
  onLoadRecentLogs,
  isLoadingRecentLogs = false,
  hasLoadedRecentLogs = false,
  isLoadingDetail = false,
}: IssueDetailProps) {
  const [expandedLogs, setExpandedLogs] = useState(false);
  const [copiedLogs, setCopiedLogs] = useState(false);
  const [copiedErrors, setCopiedErrors] = useState(false);
  const [screenshotModalOpen, setScreenshotModalOpen] = useState(false);
  const [isModalClosing, setIsModalClosing] = useState(false);
  const [expandedCrashReports, setExpandedCrashReports] = useState(false);
  const [expandedSettings, setExpandedSettings] = useState(false);

  // Comments state
  const [comments, setComments] = useState<FeedbackNote[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeletingIssue, setIsDeletingIssue] = useState(false);
  const [deleteIssueError, setDeleteIssueError] = useState<string | null>(null);

  const [screenshotObjectUrl, setScreenshotObjectUrl] = useState<string | null>(null);
  const [isScreenshotLoading, setIsScreenshotLoading] = useState(false);
  const screenshotObjectUrlRef = useRef<string | null>(null);

  // Load author name from localStorage (default to "haseab")
  useEffect(() => {
    const savedAuthor = localStorage.getItem("admin_author_name");
    // Only use saved author if it's a valid name (more than 1 character)
    if (savedAuthor && savedAuthor.length > 1) {
      setAuthorName(savedAuthor);
    } else {
      // Reset to default if invalid
      localStorage.setItem("admin_author_name", "haseab");
      setAuthorName("haseab");
    }
  }, []);

  // Save author name to localStorage when it changes
  useEffect(() => {
    if (authorName) {
      localStorage.setItem("admin_author_name", authorName);
    }
  }, [authorName]);

  // Fetch comments when issue changes
  useEffect(() => {
    if (issue) {
      setExpandedLogs(false);
      setExpandedCrashReports(false);
      setExpandedSettings(false);
      setDeleteDialogOpen(false);
      setDeleteIssueError(null);
      fetchComments(issue.id);
    } else {
      setComments([]);
    }
  }, [issue?.id]);

  useEffect(() => {
    let cancelled = false;

    const revokeExistingScreenshotUrl = () => {
      if (!screenshotObjectUrlRef.current) {
        return;
      }

      URL.revokeObjectURL(screenshotObjectUrlRef.current);
      screenshotObjectUrlRef.current = null;
    };

    const loadScreenshot = async () => {
      if (!issue || !issue.hasScreenshot) {
        revokeExistingScreenshotUrl();
        setScreenshotObjectUrl(null);
        setIsScreenshotLoading(false);
        return;
      }

      setIsScreenshotLoading(true);

      try {
        const res = await authFetch(`/api/feedback/${issue.id}/screenshot`);
        if (!res.ok) {
          throw new Error(`Failed to fetch screenshot: ${res.status}`);
        }

        const screenshotBlob = await res.blob();
        const objectUrl = URL.createObjectURL(screenshotBlob);

        if (cancelled) {
          URL.revokeObjectURL(objectUrl);
          return;
        }

        revokeExistingScreenshotUrl();
        screenshotObjectUrlRef.current = objectUrl;
        setScreenshotObjectUrl(objectUrl);
      } catch (error) {
        console.error("Failed to fetch screenshot:", error);
        revokeExistingScreenshotUrl();
        setScreenshotObjectUrl(null);
      } finally {
        if (!cancelled) {
          setIsScreenshotLoading(false);
        }
      }
    };

    void loadScreenshot();

    return () => {
      cancelled = true;
    };
  }, [issue?.id, issue?.hasScreenshot]);

  useEffect(() => {
    return () => {
      if (!screenshotObjectUrlRef.current) {
        return;
      }

      URL.revokeObjectURL(screenshotObjectUrlRef.current);
      screenshotObjectUrlRef.current = null;
    };
  }, []);

  const handleCloseModal = () => {
    if (screenshotModalOpen && !isModalClosing) {
      setIsModalClosing(true);
      setTimeout(() => {
        setScreenshotModalOpen(false);
        setIsModalClosing(false);
      }, 200); // Match animation duration
    }
  };

  // Handle escape key to close screenshot modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && screenshotModalOpen) {
        handleCloseModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [screenshotModalOpen, isModalClosing]);

  const fetchComments = async (feedbackId: number) => {
    setLoadingComments(true);
    try {
      const res = await authFetch(`/api/feedback/${feedbackId}/notes`);
      const data = await res.json();
      setComments(data.notes || []);
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async () => {
    if (!issue || !newComment.trim() || !authorName.trim()) return;

    // Create optimistic comment
    const optimisticComment = {
      id: Date.now(), // Temporary ID
      feedbackId: issue.id,
      author: authorName.trim(),
      content: newComment.trim(),
      createdAt: new Date().toISOString(),
    };

    // Optimistically add comment and clear input
    setComments((prev) => [optimisticComment, ...prev]);
    setNewComment("");
    setIsSubmittingComment(true);

    try {
      const res = await authFetch(`/api/feedback/${issue.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author: optimisticComment.author,
          content: optimisticComment.content,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // Replace optimistic comment with real one from server
        setComments((prev) =>
          prev.map((c) => (c.id === optimisticComment.id ? data.note : c))
        );
      } else {
        // Remove optimistic comment on failure
        setComments((prev) => prev.filter((c) => c.id !== optimisticComment.id));
      }
    } catch (error) {
      console.error("Failed to add comment:", error);
      // Remove optimistic comment on error
      setComments((prev) => prev.filter((c) => c.id !== optimisticComment.id));
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (noteId: number) => {
    if (!issue) return;

    try {
      const res = await authFetch(`/api/feedback/${issue.id}/notes/${noteId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== noteId));
      }
    } catch (error) {
      console.error("Failed to delete comment:", error);
    }
  };

  const handleDeleteIssue = async () => {
    if (!issue || isDeletingIssue) return;

    setIsDeletingIssue(true);
    setDeleteIssueError(null);

    try {
      await onDelete(issue.id);
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error("Failed to delete issue:", error);
      setDeleteIssueError(error instanceof Error ? error.message : "Failed to delete issue.");
    } finally {
      setIsDeletingIssue(false);
    }
  };

  if (!issue) {
    return (
      <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-12 text-center">
        <p className="text-[hsl(var(--muted-foreground))]">
          Select an issue to view details
        </p>
      </div>
    );
  }

  const typeConfig = TYPE_CONFIG[issue.type] || { label: issue.type, color: "bg-gray-500/20 text-gray-400 border-gray-500/30" };
  const sourceConfig = SOURCE_CONFIG[issue.externalSource] || SOURCE_CONFIG.app;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateString);
  };

  const handleStatusChange = async (newStatus: FeedbackStatus) => {
    await onUpdate(issue.id, { status: newStatus });
  };

  const handlePriorityChange = async (newPriority: FeedbackPriority) => {
    await onUpdate(issue.id, { priority: newPriority });
  };

  const contactValue = issue.email?.trim() ?? "";
  const isEmailContact = contactValue.includes("@") && !contactValue.includes(" ");
  const isUrlContact = /^https?:\/\//i.test(contactValue);
  const gmailReplyHref = isEmailContact
    ? buildGmailReplyHref(contactValue, issue.type, issue.description)
    : null;

  const handleCopyLogs = async () => {
    if (!issue) return;
    await navigator.clipboard.writeText(issue.recentLogs.join("\n"));
    setCopiedLogs(true);
    setTimeout(() => setCopiedLogs(false), 2000);
  };

  const handleCopyErrors = async () => {
    if (!issue) return;
    await navigator.clipboard.writeText(issue.recentErrors.join("\n"));
    setCopiedErrors(true);
    setTimeout(() => setCopiedErrors(false), 2000);
  };

  const enabledAccessibilityFlags = [
    issue.accessibilityInfo.voiceOverEnabled ? "VoiceOver" : null,
    issue.accessibilityInfo.switchControlEnabled ? "SwitchControl" : null,
    issue.accessibilityInfo.reduceMotionEnabled ? "ReduceMotion" : null,
    issue.accessibilityInfo.increaseContrastEnabled ? "IncreaseContrast" : null,
    issue.accessibilityInfo.reduceTransparencyEnabled ? "ReduceTransparency" : null,
    issue.accessibilityInfo.differentiateWithoutColorEnabled ? "DifferentiateWithoutColor" : null,
    issue.accessibilityInfo.displayHasInvertedColors ? "InvertColors" : null,
  ].filter((flag): flag is string => flag !== null);

  const settingsEntries = Object.entries(issue.settingsSnapshot || {});
  const displayCount = Math.max(issue.displayCount ?? 0, issue.displayInfo.displays.length);

  return (
    <div className="relative bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] max-h-[calc(100vh-200px)] flex flex-col overflow-hidden">
      <div className="shrink-0 z-20 px-6 py-2 bg-[hsl(var(--card))] flex justify-end">
        <button
          onClick={onClose}
          className="p-1 hover:bg-[hsl(var(--secondary))] rounded transition-colors"
          aria-label="Close issue details"
        >
          <XIcon className="w-5 h-5" />
        </button>
      </div>

      <div className="min-h-0 overflow-y-auto overflow-x-hidden px-6 pb-6 pt-2">
      {isLoadingDetail && (
        <div className="mb-3 text-xs text-[hsl(var(--muted-foreground))]">
          Loading full diagnostics...
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`px-3 py-1 text-sm font-medium rounded border ${typeConfig.color}`}>
            {typeConfig.label}
          </span>
          <span className={`px-3 py-1 text-sm font-medium rounded border ${sourceConfig.color}`}>
            {sourceConfig.label}
          </span>
          <span className="text-sm text-[hsl(var(--muted-foreground))]">
            #{issue.id}
          </span>
        </div>
      </div>

      {/* ============================================== */}
      {/* USER SUBMITTED CONTENT */}
      {/* ============================================== */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <UserIcon className="w-4 h-4 text-blue-400" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-blue-400">
            User Submitted
          </h2>
        </div>
        <div className="border border-blue-500/20 rounded-lg p-4 bg-blue-500/5 space-y-4">
          {/* Source */}
          <div>
            <h3 className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1.5">
              Source
            </h3>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className={`px-2 py-1 font-medium rounded border ${sourceConfig.color}`}>
                {sourceConfig.label}
              </span>
              {issue.externalId && (
                <span className="px-2 py-1 bg-[hsl(var(--secondary))] rounded">
                  ID: {issue.externalId}
                </span>
              )}
              {issue.externalUrl && (
                <a
                  href={issue.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-1 bg-[hsl(var(--secondary))] rounded text-[hsl(var(--primary))] hover:underline"
                >
                  Open source link
                </a>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1.5">
              Description
            </h3>
            <p className="text-sm whitespace-pre-wrap bg-[hsl(var(--secondary))] rounded-lg p-3">
              {getDisplayDescription(issue.description)}
            </p>
          </div>

          {/* Contact */}
          {issue.email && (
            <div>
              <h3 className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1.5">
                Contact
              </h3>
              <div className="flex items-center gap-3">
                {isEmailContact ? (
                  <>
                    <a
                      href={`mailto:${contactValue}`}
                      className="text-sm text-[hsl(var(--primary))] hover:underline"
                    >
                      {contactValue}
                    </a>
                    <a
                      href={gmailReplyHref ?? "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-2.5 py-1 bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] rounded-lg text-xs hover:bg-[hsl(var(--secondary))]/80 transition-all duration-200 hover:scale-105 active:scale-95"
                    >
                      <GmailIcon className="w-3.5 h-3.5" />
                      Reply via Gmail
                    </a>
                  </>
                ) : isUrlContact ? (
                  <a
                    href={contactValue}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[hsl(var(--primary))] hover:underline break-all"
                  >
                    {contactValue}
                  </a>
                ) : (
                  <span className="text-sm break-all">{contactValue}</span>
                )}
              </div>
            </div>
          )}

          {/* Screenshot */}
          {issue.hasScreenshot && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <h3 className="text-xs font-medium text-[hsl(var(--muted-foreground))] flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5" />
                  Screenshot
                </h3>
                <div className="flex items-center gap-2">
                  <a
                    href={screenshotObjectUrl || "#"}
                    download={`feedback-${issue.id}-screenshot.png`}
                    onClick={(event) => {
                      if (!screenshotObjectUrl) {
                        event.preventDefault();
                      }
                    }}
                    className="flex items-center gap-1 text-xs text-[hsl(var(--muted-foreground))] hover:text-white transition-colors disabled:opacity-50"
                  >
                    <DownloadIcon className="w-3 h-3" />
                    Download
                  </a>
                  <button
                    onClick={() => setScreenshotModalOpen(true)}
                    disabled={!screenshotObjectUrl}
                    className="text-xs text-[hsl(var(--primary))] hover:underline"
                  >
                    Full Screen
                  </button>
                </div>
              </div>
              {!screenshotObjectUrl ? (
                <div className="bg-[hsl(var(--secondary))] rounded-lg p-3 text-xs text-[hsl(var(--muted-foreground))]">
                  {isScreenshotLoading ? "Loading screenshot..." : "Screenshot unavailable."}
                </div>
              ) : (
                <div
                  className="bg-[hsl(var(--secondary))] rounded-lg p-2 overflow-hidden cursor-pointer transition-all max-h-40"
                  onClick={() => setScreenshotModalOpen(true)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={screenshotObjectUrl}
                    alt="Feedback screenshot"
                    className="w-full rounded object-cover max-h-36"
                  />
                </div>
              )}
            </div>
          )}

          {/* System Info - Compact */}
          <div>
            <h3 className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1.5">
              System Info
            </h3>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-1 bg-[hsl(var(--secondary))] rounded">
                v{issue.appVersion}
              </span>
              <span className="px-2 py-1 bg-[hsl(var(--secondary))] rounded">
                macOS {issue.macOSVersion}
              </span>
              <span className="px-2 py-1 bg-[hsl(var(--secondary))] rounded">
                {issue.deviceModel}
              </span>
            </div>
          </div>

          {/* Submitted timestamp */}
          <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
            Submitted {formatDate(issue.createdAt)}
          </p>
        </div>
      </div>

      {/* Screenshot Modal */}
      {screenshotModalOpen && issue.hasScreenshot && screenshotObjectUrl && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm ${isModalClosing ? "animate-fade-out" : "animate-fade-in"}`}
          onClick={handleCloseModal}
        >
          {/* Close button */}
          <button
            onClick={handleCloseModal}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
          >
            <XIcon className="w-6 h-6 text-white" />
          </button>
          {/* Download button */}
          <a
            href={screenshotObjectUrl}
            download={`feedback-${issue.id}-screenshot.png`}
            onClick={(e) => e.stopPropagation()}
            className="absolute top-4 right-16 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
          >
            <DownloadIcon className="w-6 h-6 text-white" />
          </a>
          {/* Image container */}
          <div
            className={`max-w-[95vw] max-h-[95vh] p-4 ${isModalClosing ? "animate-zoom-out" : "animate-zoom-in"}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={screenshotObjectUrl}
              alt="Feedback screenshot"
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* ============================================== */}
      {/* ADMIN CONTROLS */}
      {/* ============================================== */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <SettingsIcon className="w-4 h-4 text-violet-400" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-violet-400">
            Admin Controls
          </h2>
        </div>
        <div className="border border-violet-500/20 rounded-lg p-4 bg-violet-500/5 space-y-4">
          {/* Status and Priority Selectors */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1.5">
                Status
              </label>
              <select
                value={issue.status}
                onChange={(e) => handleStatusChange(e.target.value as FeedbackStatus)}
                className="w-full px-3 py-2 bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] transition-all duration-200"
              >
                {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                  <option key={value} value={value}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1.5">
                Priority
              </label>
              <select
                value={issue.priority}
                onChange={(e) => handlePriorityChange(e.target.value as FeedbackPriority)}
                className="w-full px-3 py-2 bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] transition-all duration-200"
              >
                {Object.entries(PRIORITY_CONFIG).map(([value, config]) => (
                  <option key={value} value={value}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Comments Section */}
          <div>
            <h3 className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-2">
              Notes ({comments.length})
            </h3>

            {/* Add Comment Form */}
            <div className="mb-3 space-y-2">
              {!authorName && (
                <input
                  type="text"
                  placeholder="Your name..."
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="w-full px-3 py-2 bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] transition-all duration-200"
                />
              )}
              <div className="flex gap-2">
                <textarea
                  placeholder="Add a note..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.metaKey) {
                      handleAddComment();
                    }
                  }}
                  className="flex-1 px-3 py-2 bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] min-h-[50px] resize-none transition-all duration-200"
                />
              </div>
              <div className="flex items-center justify-between">
                {authorName && (
                  <button
                    onClick={() => setAuthorName("")}
                    className="text-xs text-[hsl(var(--muted-foreground))] hover:text-white transition-colors"
                  >
                    Posting as {authorName} (change)
                  </button>
                )}
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || !authorName.trim() || isSubmittingComment}
                  className="ml-auto px-3 py-1.5 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {isSubmittingComment ? "Adding..." : "Add Note"}
                </button>
              </div>
            </div>

            {/* Comments List */}
            {loadingComments ? (
              <div className="text-sm text-[hsl(var(--muted-foreground))] text-center py-3">
                Loading notes...
              </div>
            ) : comments.length === 0 ? (
              <div className="text-xs text-[hsl(var(--muted-foreground))] text-center py-3 bg-[hsl(var(--secondary))]/50 rounded-lg">
                No notes yet
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="group relative animate-card-enter"
                  >
                    <div className="flex gap-2">
                      {/* Avatar */}
                      <div className="shrink-0">
                        {comment.author.toLowerCase() === "haseab" ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src="https://lh3.googleusercontent.com/ogw/AF2bZyjSVtYjTyMfG_XpImqvv7tmXJZuS7C4bCL2vhdbJP0Z2cmA=s128-c-mo"
                            alt={comment.author}
                            className="w-6 h-6 rounded-full ring-1 ring-[hsl(var(--border))]"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-linear-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white text-[10px] font-medium ring-1 ring-[hsl(var(--border))]">
                            {comment.author.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      {/* Comment Content */}
                      <div className="flex-1 min-w-0">
                        <div className="bg-[hsl(var(--secondary))] rounded-lg rounded-tl-sm px-3 py-2">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-semibold">{comment.author}</span>
                            <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
                              {formatDate(comment.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs whitespace-pre-wrap leading-relaxed">{comment.content}</p>
                        </div>
                      </div>
                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="opacity-0 group-hover:opacity-100 self-center p-1 hover:bg-red-500/10 rounded-full transition-all"
                        title="Delete note"
                      >
                        <TrashIcon className="w-3 h-3 text-[hsl(var(--muted-foreground))] hover:text-red-400 transition-colors" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Updated timestamp */}
          {issue.updatedAt !== issue.createdAt && (
            <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
              Last updated {formatDate(issue.updatedAt)}
            </p>
          )}
        </div>
      </div>

      {/* ============================================== */}
      {/* TECHNICAL DETAILS */}
      {/* ============================================== */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <CodeIcon className="w-4 h-4 text-emerald-400" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
            Technical Details
          </h2>
        </div>
        <div className="border border-emerald-500/20 rounded-lg p-4 bg-emerald-500/5 space-y-4">
          {/* System Info - Full */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-[hsl(var(--secondary))] rounded px-2 py-1.5">
              <span className="text-[hsl(var(--muted-foreground))]">App:</span>{" "}
              {issue.appVersion} ({issue.buildNumber})
            </div>
            <div className="bg-[hsl(var(--secondary))] rounded px-2 py-1.5">
              <span className="text-[hsl(var(--muted-foreground))]">macOS:</span>{" "}
              {issue.macOSVersion}
            </div>
            <div className="bg-[hsl(var(--secondary))] rounded px-2 py-1.5">
              <span className="text-[hsl(var(--muted-foreground))]">Device:</span>{" "}
              {issue.deviceModel}
            </div>
            <div className="bg-[hsl(var(--secondary))] rounded px-2 py-1.5">
              <span className="text-[hsl(var(--muted-foreground))]">Disk:</span>{" "}
              {issue.freeDiskSpace} free
            </div>
            {issue.diagnosticsTimestamp && (
              <div className="bg-[hsl(var(--secondary))] rounded px-2 py-1.5 col-span-2">
                <span className="text-[hsl(var(--muted-foreground))]">Captured:</span>{" "}
                {formatDate(issue.diagnosticsTimestamp)}
              </div>
            )}
          </div>

          {/* Database Stats */}
          <div>
            <h3 className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1.5">
              Database Stats
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-[hsl(var(--secondary))] rounded px-2 py-1.5">
                <span className="text-[hsl(var(--muted-foreground))]">Sessions:</span>{" "}
                {issue.databaseStats.sessionCount.toLocaleString()}
              </div>
              <div className="bg-[hsl(var(--secondary))] rounded px-2 py-1.5">
                <span className="text-[hsl(var(--muted-foreground))]">Frames:</span>{" "}
                {issue.databaseStats.frameCount.toLocaleString()}
              </div>
              <div className="bg-[hsl(var(--secondary))] rounded px-2 py-1.5">
                <span className="text-[hsl(var(--muted-foreground))]">Segments:</span>{" "}
                {issue.databaseStats.segmentCount.toLocaleString()}
              </div>
              <div className="bg-[hsl(var(--secondary))] rounded px-2 py-1.5">
                <span className="text-[hsl(var(--muted-foreground))]">DB Size:</span>{" "}
                {issue.databaseStats.databaseSizeMB.toFixed(1)} MB
              </div>
            </div>
          </div>

          {/* Performance Snapshot */}
          <div>
            <h3 className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1.5">
              Performance Snapshot
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-[hsl(var(--secondary))] rounded px-2 py-1.5">
                <span className="text-[hsl(var(--muted-foreground))]">CPU:</span>{" "}
                {issue.performanceInfo.cpuUsagePercent.toFixed(1)}%
              </div>
              <div className="bg-[hsl(var(--secondary))] rounded px-2 py-1.5">
                <span className="text-[hsl(var(--muted-foreground))]">Memory:</span>{" "}
                {issue.performanceInfo.memoryUsedGB.toFixed(1)} / {issue.performanceInfo.memoryTotalGB.toFixed(1)} GB
              </div>
              <div className="bg-[hsl(var(--secondary))] rounded px-2 py-1.5">
                <span className="text-[hsl(var(--muted-foreground))]">Pressure:</span>{" "}
                {issue.performanceInfo.memoryPressure}
              </div>
              <div className="bg-[hsl(var(--secondary))] rounded px-2 py-1.5">
                <span className="text-[hsl(var(--muted-foreground))]">Swap:</span>{" "}
                {issue.performanceInfo.swapUsedGB.toFixed(1)} GB
              </div>
              <div className="bg-[hsl(var(--secondary))] rounded px-2 py-1.5">
                <span className="text-[hsl(var(--muted-foreground))]">Thermal:</span>{" "}
                {issue.performanceInfo.thermalState}
              </div>
              <div className="bg-[hsl(var(--secondary))] rounded px-2 py-1.5">
                <span className="text-[hsl(var(--muted-foreground))]">Power:</span>{" "}
                {issue.performanceInfo.powerSource}
                {issue.performanceInfo.batteryLevel !== null ? " (" + issue.performanceInfo.batteryLevel + "%)" : ""}
              </div>
              <div className="bg-[hsl(var(--secondary))] rounded px-2 py-1.5">
                <span className="text-[hsl(var(--muted-foreground))]">Low Power:</span>{" "}
                {issue.performanceInfo.isLowPowerModeEnabled ? "On" : "Off"}
              </div>
              <div className="bg-[hsl(var(--secondary))] rounded px-2 py-1.5">
                <span className="text-[hsl(var(--muted-foreground))]">Processors:</span>{" "}
                {issue.performanceInfo.processorCount}
              </div>
            </div>
          </div>

          {/* Running Process Signals */}
          <div>
            <h3 className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1.5">
              Running Process Signals
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-[hsl(var(--secondary))] rounded px-2 py-1.5">
                <span className="text-[hsl(var(--muted-foreground))]">Total Running:</span>{" "}
                {issue.processInfo.totalRunning}
              </div>
              <div className="bg-[hsl(var(--secondary))] rounded px-2 py-1.5">
                <span className="text-[hsl(var(--muted-foreground))]">Event Monitor Apps:</span>{" "}
                {issue.processInfo.eventMonitoringApps}
              </div>
              <div className="bg-[hsl(var(--secondary))] rounded px-2 py-1.5">
                <span className="text-[hsl(var(--muted-foreground))]">Window Managers:</span>{" "}
                {issue.processInfo.windowManagementApps}
              </div>
              <div className="bg-[hsl(var(--secondary))] rounded px-2 py-1.5">
                <span className="text-[hsl(var(--muted-foreground))]">Security/MDM:</span>{" "}
                {issue.processInfo.securityApps}
              </div>
              <div className="bg-[hsl(var(--secondary))] rounded px-2 py-1.5">
                <span className="text-[hsl(var(--muted-foreground))]">AXUIServer CPU:</span>{" "}
                {issue.processInfo.axuiServerCPU.toFixed(1)}%
              </div>
              <div className="bg-[hsl(var(--secondary))] rounded px-2 py-1.5">
                <span className="text-[hsl(var(--muted-foreground))]">WindowServer CPU:</span>{" "}
                {issue.processInfo.windowServerCPU.toFixed(1)}%
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {issue.processInfo.hasJamf && (
                <span className="px-2 py-0.5 text-[10px] rounded border bg-amber-500/20 text-amber-300 border-amber-500/30">
                  Jamf detected
                </span>
              )}
              {issue.processInfo.hasKandji && (
                <span className="px-2 py-0.5 text-[10px] rounded border bg-amber-500/20 text-amber-300 border-amber-500/30">
                  Kandji detected
                </span>
              )}
              {!issue.processInfo.hasJamf && !issue.processInfo.hasKandji && (
                <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
                  No Jamf/Kandji markers
                </span>
              )}
            </div>
          </div>

          {/* Display Configuration */}
          <div>
            <h3 className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1.5">
              Displays ({displayCount})
            </h3>
            <div className="space-y-1.5">
              {issue.displayInfo.displays.length > 0 ? (
                issue.displayInfo.displays.map((display) => (
                  <div
                    key={display.index + "-" + display.frame}
                    className="bg-[hsl(var(--secondary))] rounded px-2 py-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span>
                        [{display.index}] {display.resolution} @{display.backingScaleFactor}x {display.refreshRate} {display.colorSpace}
                      </span>
                      {display.index === issue.displayInfo.mainDisplayIndex && (
                        <span className="px-1.5 py-0.5 text-[10px] rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Main
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-[hsl(var(--muted-foreground))] mt-1">
                      frame {display.frame} • {display.isRetina ? "Retina" : "Non-Retina"}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-[10px] text-[hsl(var(--muted-foreground))]">
                  No display data captured.
                </div>
              )}
            </div>
          </div>

          {/* Accessibility Flags */}
          <div>
            <h3 className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1.5">
              Accessibility
            </h3>
            {enabledAccessibilityFlags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {enabledAccessibilityFlags.map((flag) => (
                  <span
                    key={flag}
                    className="px-2 py-0.5 text-[10px] rounded border bg-cyan-500/20 text-cyan-300 border-cyan-500/30"
                  >
                    {flag}
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-[10px] text-[hsl(var(--muted-foreground))]">
                No accessibility flags enabled.
              </div>
            )}
          </div>

          {/* Settings Snapshot */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                Settings Snapshot ({settingsEntries.length})
              </h3>
              {settingsEntries.length > 12 && (
                <button
                  onClick={() => setExpandedSettings(!expandedSettings)}
                  className="text-[10px] text-[hsl(var(--primary))] hover:underline"
                >
                  {expandedSettings ? "Show less" : "Show all"}
                </button>
              )}
            </div>
            {settingsEntries.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 text-xs">
                {(expandedSettings ? settingsEntries : settingsEntries.slice(0, 12)).map(([key, value]) => (
                  <div key={key} className="bg-[hsl(var(--secondary))] rounded px-2 py-1.5">
                    <span className="text-[hsl(var(--muted-foreground))]">{key}:</span>{" "}
                    <span className="font-mono">{String(value)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[10px] text-[hsl(var(--muted-foreground))]">
                No settings snapshot captured.
              </div>
            )}
          </div>

          {/* Emergency Crash Reports */}
          {issue.emergencyCrashReports.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <h3 className="text-xs font-medium text-amber-300">
                  Emergency Crash Reports ({issue.emergencyCrashReports.length})
                </h3>
                {issue.emergencyCrashReports.length > 1 && (
                  <button
                    onClick={() => setExpandedCrashReports(!expandedCrashReports)}
                    className="text-[10px] text-[hsl(var(--primary))] hover:underline"
                  >
                    {expandedCrashReports ? "Show less" : "Show all"}
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {(expandedCrashReports ? issue.emergencyCrashReports : issue.emergencyCrashReports.slice(0, 1)).map((report, index) => (
                  <div key={index} className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 max-h-48 overflow-y-auto">
                    <pre className="text-[10px] text-amber-100 whitespace-pre-wrap">{report}</pre>
                  </div>
                ))}
                {!expandedCrashReports && issue.emergencyCrashReports.length > 1 && (
                  <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
                    ... and {issue.emergencyCrashReports.length - 1} more report(s)
                  </p>
                )}
              </div>
            </div>
          )}


          {/* Recent Errors */}
          {issue.recentErrors.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <h3 className="text-xs font-medium text-red-400">
                  Recent Errors ({issue.recentErrors.length})
                </h3>
                <button
                  onClick={handleCopyErrors}
                  className="flex items-center gap-1 text-[10px] text-[hsl(var(--muted-foreground))] hover:text-white transition-colors"
                >
                  {copiedErrors ? (
                    <>
                      <CheckIcon className="w-3 h-3 text-green-400" />
                      <span className="text-green-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <CopyIcon className="w-3 h-3" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2 max-h-32 overflow-y-auto">
                <pre className="text-[10px] text-red-300 whitespace-pre-wrap">
                  {issue.recentErrors.join("\n")}
                </pre>
              </div>
            </div>
          )}

          {/* Recent Logs */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                {hasLoadedRecentLogs ? `Recent Logs (${issue.recentLogs.length})` : "Recent Logs"}
              </h3>
              {hasLoadedRecentLogs && issue.recentLogs.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyLogs}
                    className="flex items-center gap-1 text-[10px] text-[hsl(var(--muted-foreground))] hover:text-white transition-colors"
                  >
                    {copiedLogs ? (
                      <>
                        <CheckIcon className="w-3 h-3 text-green-400" />
                        <span className="text-green-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <CopyIcon className="w-3 h-3" />
                        Copy
                      </>
                    )}
                  </button>
                  {issue.recentLogs.length > 50 && (
                    <button
                      onClick={() => setExpandedLogs(!expandedLogs)}
                      className="text-[10px] text-[hsl(var(--primary))] hover:underline"
                    >
                      {expandedLogs ? "Show less" : "Show all"}
                    </button>
                  )}
                </div>
              )}
            </div>

            {!hasLoadedRecentLogs ? (
              <button
                type="button"
                onClick={() => void onLoadRecentLogs(issue.id)}
                disabled={isLoadingRecentLogs}
                className="px-2.5 py-1.5 text-[10px] rounded border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--secondary))]/80 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {isLoadingRecentLogs ? "Loading recent logs..." : "Load recent logs"}
              </button>
            ) : issue.recentLogs.length > 0 ? (
              <div className={`bg-[hsl(var(--secondary))] rounded-lg p-2 overflow-y-auto ${expandedLogs ? "max-h-[400px]" : "max-h-32"}`}>
                <pre className="text-[10px] text-[hsl(var(--muted-foreground))] whitespace-pre-wrap">
                  {expandedLogs
                    ? issue.recentLogs.join("\n")
                    : issue.recentLogs.slice(0, 50).join("\n")}
                  {!expandedLogs && issue.recentLogs.length > 50 && (
                    <span className="text-[hsl(var(--primary))]">
                      {"\n"}... and {issue.recentLogs.length - 50} more
                    </span>
                  )}
                </pre>
              </div>
            ) : (
              <div className="text-[10px] text-[hsl(var(--muted-foreground))]">
                No recent logs captured.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================================== */}
      {/* DANGER ZONE */}
      {/* ============================================== */}
      <div className="mt-6 border border-red-500/20 rounded-lg p-4 bg-red-500/5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-red-300">
              Danger Zone
            </h2>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
              Delete this issue and all notes permanently.
            </p>
          </div>
          <button
            onClick={() => {
              setDeleteIssueError(null);
              setDeleteDialogOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-red-500/40 bg-red-500/20 text-red-200 hover:bg-red-500/30 transition-colors"
          >
            <TrashIcon className="w-3.5 h-3.5" />
            Delete Issue
          </button>
        </div>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={(open) => !isDeletingIssue && setDeleteDialogOpen(open)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-300">
              <TrashIcon className="w-4 h-4" />
              Delete Issue #{issue.id}?
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
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeletingIssue}
              className="px-3 py-2 text-sm rounded-lg border border-[hsl(var(--border))] hover:bg-[hsl(var(--secondary))] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteIssue}
              disabled={isDeletingIssue}
              className="px-3 py-2 text-sm rounded-lg border border-red-500/40 bg-red-500/20 text-red-200 hover:bg-red-500/30 transition-colors disabled:opacity-50"
            >
              {isDeletingIssue ? "Deleting..." : "Delete Permanently"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}

function buildGmailReplyHref(email: string, issueType: string, issueDescription: string): string {
  const subject = `Re: Your ${issueType} for Retrace`;
  const body = `Hi,\n\nThanks for reaching out about Retrace.\n\n\n---\nOriginal message:\n${issueDescription}`;
  const mailtoTarget = `mailto:${email}?subject=${subject}&body=${body}`;

  // This opens the draft in Gmail's standard inbox UI instead of the compose-only view.
  return `https://mail.google.com/mail/?extsrc=mailto&url=${encodeURIComponent(mailtoTarget)}`;
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function ImageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function CodeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function GmailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
    </svg>
  );
}
