"use client";

import { FeedbackItem, STATUS_CONFIG, PRIORITY_CONFIG, TYPE_CONFIG, getTagColor } from "@/lib/types/feedback";

interface IssueCardProps {
  issue: FeedbackItem;
  isUnread?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  compact?: boolean;
}

export function IssueCard({ issue, isUnread = false, isSelected, onClick, compact = false }: IssueCardProps) {
  const typeConfig = TYPE_CONFIG[issue.type] || { label: issue.type, color: "bg-gray-500/20 text-gray-400 border-gray-500/30" };
  const statusConfig = STATUS_CONFIG[issue.status] || STATUS_CONFIG.open;
  const priorityConfig = PRIORITY_CONFIG[issue.priority] || PRIORITY_CONFIG.medium;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (compact) {
    return (
      <div
        onClick={onClick}
        className={`p-3 bg-[hsl(var(--card))] rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5 active:scale-[0.98] ${
          isSelected
            ? "border-[hsl(var(--primary))] ring-1 ring-[hsl(var(--primary))] shadow-md shadow-[hsl(var(--primary))]/10"
            : isUnread
              ? "border-sky-400/60 ring-1 ring-sky-400/40 shadow-[0_0_0_1px_rgba(56,189,248,0.3),0_0_16px_rgba(56,189,248,0.15)] hover:border-sky-300/70"
              : "border-[hsl(var(--border))] hover:border-[hsl(var(--muted-foreground))]/50"
        }`}
      >
        <div className="flex items-center gap-2 mb-2">
          {isUnread && (
            <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide rounded border border-sky-400/40 bg-sky-500/10 text-sky-200">
              Unread
            </span>
          )}
          <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded border ${typeConfig.color}`}>
            {issue.type === "Bug Report" ? "Bug" : issue.type === "Feature Request" ? "Feature" : "Q"}
          </span>
          <PriorityIndicator priority={issue.priority} />
          {issue.hasScreenshot && (
            <span className="text-purple-400 text-[10px]">
              <ImageIcon className="w-3 h-3" />
            </span>
          )}
        </div>
        <p className="text-sm line-clamp-2 mb-2">{issue.description}</p>
        {issue.tags && issue.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {issue.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className={`px-1.5 py-0.5 text-[10px] font-medium rounded border ${getTagColor(tag)}`}
              >
                {tag}
              </span>
            ))}
            {issue.tags.length > 3 && (
              <span className="px-1.5 py-0.5 text-[10px] text-[hsl(var(--muted-foreground))]">
                +{issue.tags.length - 3}
              </span>
            )}
          </div>
        )}
        <div className="flex items-center justify-between text-[10px] text-[hsl(var(--muted-foreground))]">
          {issue.email ? (
            <span className="truncate min-w-0" title={issue.email}>
              {issue.email}
            </span>
          ) : (
            <span className="text-[hsl(var(--muted-foreground))]/50">No email</span>
          )}
          <span className="shrink-0 ml-2">{formatDate(issue.createdAt)}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`p-4 bg-[hsl(var(--card))] rounded-xl border cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5 active:scale-[0.98] ${
        isSelected
          ? "border-[hsl(var(--primary))] ring-1 ring-[hsl(var(--primary))] shadow-md shadow-[hsl(var(--primary))]/10"
          : isUnread
            ? "border-sky-400/60 ring-1 ring-sky-400/40 shadow-[0_0_0_1px_rgba(56,189,248,0.3),0_0_16px_rgba(56,189,248,0.15)] hover:border-sky-300/70"
            : "border-[hsl(var(--border))] hover:border-[hsl(var(--muted-foreground))]/50"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {isUnread && (
              <span className="px-2 py-0.5 text-xs font-semibold uppercase tracking-wide rounded border border-sky-400/40 bg-sky-500/10 text-sky-200">
                Unread
              </span>
            )}
            <span className={`px-2 py-0.5 text-xs font-medium rounded border ${typeConfig.color}`}>
              {typeConfig.label}
            </span>
            <span className={`px-2 py-0.5 text-xs font-medium rounded border ${statusConfig.color}`}>
              {statusConfig.label}
            </span>
            <PriorityIndicator priority={issue.priority} showLabel />
            {issue.hasScreenshot && (
              <span className="px-2 py-0.5 text-xs bg-purple-500/20 text-purple-400 rounded border border-purple-500/30 flex items-center gap-1">
                <ImageIcon className="w-3 h-3" />
                Screenshot
              </span>
            )}
            {issue.tags && issue.tags.map((tag) => (
              <span
                key={tag}
                className={`px-2 py-0.5 text-xs font-medium rounded border ${getTagColor(tag)}`}
              >
                {tag}
              </span>
            ))}
          </div>
          <p className="text-sm line-clamp-2 mb-2">{issue.description}</p>
          <div className="flex items-center gap-3 text-xs text-[hsl(var(--muted-foreground))]">
            <span>#{issue.id}</span>
            <span>v{issue.appVersion}</span>
            <span>macOS {issue.macOSVersion}</span>
            <span>{formatDate(issue.createdAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PriorityIndicator({ priority, showLabel = false }: { priority: string; showLabel?: boolean }) {
  const config = PRIORITY_CONFIG[priority as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG.medium;

  const getPriorityIcon = () => {
    switch (priority) {
      case "critical":
        return <ArrowUpIcon className="w-3 h-3 text-red-400" />;
      case "high":
        return <ArrowUpIcon className="w-3 h-3 text-orange-400" />;
      case "medium":
        return <MinusIcon className="w-3 h-3 text-blue-400" />;
      case "low":
        return <ArrowDownIcon className="w-3 h-3 text-slate-400" />;
      default:
        return <MinusIcon className="w-3 h-3 text-gray-400" />;
    }
  };

  if (showLabel) {
    return (
      <span className={`px-2 py-0.5 text-xs font-medium rounded border ${config.color} flex items-center gap-1`}>
        {getPriorityIcon()}
        {config.label}
      </span>
    );
  }

  return getPriorityIcon();
}

// Simple SVG icons
function ImageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

function ArrowUpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </svg>
  );
}

function ArrowDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <polyline points="19 12 12 19 5 12" />
    </svg>
  );
}

function MinusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
