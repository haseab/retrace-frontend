export type FeedbackType = "Bug Report" | "Feature Request" | "Question";
export type FeedbackStatus = "open" | "in_progress" | "resolved" | "closed";
export type FeedbackPriority = "low" | "medium" | "high" | "critical";
export type ViewMode = "kanban" | "list";

export interface DatabaseStats {
  sessionCount: number;
  frameCount: number;
  segmentCount: number;
  databaseSizeMB: number;
}

export interface DiagnosticDisplay {
  index: number;
  resolution: string;
  backingScaleFactor: string;
  colorSpace: string;
  refreshRate: string;
  isRetina: boolean;
  frame: string;
}

export interface DiagnosticDisplayInfo {
  count: number;
  displays: DiagnosticDisplay[];
  mainDisplayIndex: number;
}

export interface DiagnosticProcessInfo {
  totalRunning: number;
  eventMonitoringApps: number;
  windowManagementApps: number;
  securityApps: number;
  hasJamf: boolean;
  hasKandji: boolean;
  axuiServerCPU: number;
  windowServerCPU: number;
}

export interface DiagnosticAccessibilityInfo {
  voiceOverEnabled: boolean;
  switchControlEnabled: boolean;
  reduceMotionEnabled: boolean;
  increaseContrastEnabled: boolean;
  reduceTransparencyEnabled: boolean;
  differentiateWithoutColorEnabled: boolean;
  displayHasInvertedColors: boolean;
}

export interface DiagnosticPerformanceInfo {
  cpuUsagePercent: number;
  memoryUsedGB: number;
  memoryTotalGB: number;
  memoryPressure: string;
  swapUsedGB: number;
  thermalState: string;
  processorCount: number;
  isLowPowerModeEnabled: boolean;
  powerSource: string;
  batteryLevel: number | null;
}

// Note/comment on a feedback item
export interface FeedbackNote {
  id: number;
  feedbackId: number;
  author: string;
  content: string;
  createdAt: string;
}

export interface FeedbackItem {
  id: number;
  type: FeedbackType;
  email: string | null;
  description: string;
  isRead: boolean;
  status: FeedbackStatus;
  priority: FeedbackPriority;
  notes: string; // Deprecated - kept for backwards compatibility
  tags: string[];
  appVersion: string;
  buildNumber: string;
  macOSVersion: string;
  deviceModel: string;
  totalDiskSpace: string;
  freeDiskSpace: string;
  databaseStats: DatabaseStats;
  recentErrors: string[];
  recentLogs: string[];
  diagnosticsTimestamp: string | null;
  settingsSnapshot: Record<string, string>;
  displayCount: number;
  displayInfo: DiagnosticDisplayInfo;
  processInfo: DiagnosticProcessInfo;
  accessibilityInfo: DiagnosticAccessibilityInfo;
  performanceInfo: DiagnosticPerformanceInfo;
  emergencyCrashReports: string[];
  hasScreenshot: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FeedbackFilters {
  type?: FeedbackType | "all";
  status?: FeedbackStatus | "all";
  priority?: FeedbackPriority | "all";
  search?: string;
}

export interface FeedbackResponse {
  count: number;
  total: number;
  hasMore: boolean;
  offset: number;
  limit: number;
  feedback: FeedbackItem[];
}

// Status display configuration
export const STATUS_CONFIG: Record<FeedbackStatus, { label: string; color: string }> = {
  open: { label: "Open", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  in_progress: { label: "In Progress", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  resolved: { label: "Resolved", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  closed: { label: "Closed", color: "bg-gray-500/20 text-gray-400 border-gray-500/30" },
};

// Priority display configuration
export const PRIORITY_CONFIG: Record<FeedbackPriority, { label: string; color: string }> = {
  low: { label: "Low", color: "bg-slate-500/20 text-slate-400 border-slate-500/30" },
  medium: { label: "Medium", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  high: { label: "High", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  critical: { label: "Critical", color: "bg-red-500/20 text-red-400 border-red-500/30" },
};

// Type display configuration
export const TYPE_CONFIG: Record<FeedbackType, { label: string; color: string }> = {
  "Bug Report": { label: "Bug Report", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  "Feature Request": { label: "Feature Request", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  "Question": { label: "Question", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
};

// Download analytics types (for analytics page)
export interface DownloadItem {
  id: number;
  version: string | null;
  source: string | null;
  os: string | null;
  os_version: string | null;
  browser: string | null;
  browser_version: string | null;
  architecture: string | null;
  platform: string | null;
  language: string | null;
  screen_resolution: string | null;
  timezone: string | null;
  referrer: string | null;
  user_agent: string | null;
  ip: string | null;
  country: string | null;
  city: string | null;
  region: string | null;
  created_at: string;
}

export interface DownloadStats {
  totalDownloads: number;
  byOs: { os: string; count: number }[];
  bySource: { source: string; count: number }[];
  recent: DownloadItem[];
  hourlyDownloads?: { created_at: string }[];
  dailyDownloads?: { created_at: string }[];
}

// Tag color options - generates consistent colors based on tag name
export const TAG_COLORS = [
  "bg-pink-500/20 text-pink-400 border-pink-500/30",
  "bg-violet-500/20 text-violet-400 border-violet-500/30",
  "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  "bg-teal-500/20 text-teal-400 border-teal-500/30",
  "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "bg-amber-500/20 text-amber-400 border-amber-500/30",
  "bg-rose-500/20 text-rose-400 border-rose-500/30",
];

export function getTagColor(tag: string): string {
  // Generate a consistent color based on tag string
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
}
