import type { Client } from "@libsql/client";

export interface FeedbackDisplay {
  index: number;
  resolution: string;
  backingScaleFactor: string;
  colorSpace: string;
  refreshRate: string;
  isRetina: boolean;
  frame: string;
}

export interface FeedbackDisplayInfo {
  count: number;
  displays: FeedbackDisplay[];
  mainDisplayIndex: number;
}

export interface FeedbackProcessInfo {
  totalRunning: number;
  eventMonitoringApps: number;
  windowManagementApps: number;
  securityApps: number;
  hasJamf: boolean;
  hasKandji: boolean;
  axuiServerCPU: number;
  windowServerCPU: number;
}

export interface FeedbackAccessibilityInfo {
  voiceOverEnabled: boolean;
  switchControlEnabled: boolean;
  reduceMotionEnabled: boolean;
  increaseContrastEnabled: boolean;
  reduceTransparencyEnabled: boolean;
  differentiateWithoutColorEnabled: boolean;
  displayHasInvertedColors: boolean;
}

export interface FeedbackPerformanceInfo {
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

export interface FeedbackDiagnosticsPayload {
  settingsSnapshot?: Record<string, unknown>;
  recentErrors?: string[];
  recentLogs?: string[];
  displayInfo?: FeedbackDisplayInfo;
  processInfo?: FeedbackProcessInfo;
  accessibilityInfo?: FeedbackAccessibilityInfo;
  performanceInfo?: FeedbackPerformanceInfo;
  emergencyCrashReports?: string[];
}

export interface UpsertFeedbackDiagnosticsOptions {
  writePerformance?: boolean;
  writeProcess?: boolean;
  writeAccessibility?: boolean;
  writeDisplays?: boolean;
  writeSettings?: boolean;
  writeCrashReports?: boolean;
  writeLogEntries?: boolean;
}

export interface FeedbackApiItem {
  id: number;
  type: string;
  email: string | null;
  description: string;
  isRead: boolean;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "critical";
  notes: string;
  tags: string[];
  appVersion: string;
  buildNumber: string;
  macOSVersion: string;
  deviceModel: string;
  totalDiskSpace: string;
  freeDiskSpace: string;
  databaseStats: {
    sessionCount: number;
    frameCount: number;
    segmentCount: number;
    databaseSizeMB: number;
  };
  recentErrors: string[];
  recentLogs: string[];
  diagnosticsTimestamp: string | null;
  settingsSnapshot: Record<string, string>;
  displayCount: number;
  displayInfo: FeedbackDisplayInfo;
  processInfo: FeedbackProcessInfo;
  accessibilityInfo: FeedbackAccessibilityInfo;
  performanceInfo: FeedbackPerformanceInfo;
  emergencyCrashReports: string[];
  hasScreenshot: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NormalizedDiagnosticsState {
  hasPerformance: boolean;
  hasProcess: boolean;
  hasAccessibility: boolean;
  hasDisplays: boolean;
  hasSettings: boolean;
  hasCrashReports: boolean;
  hasLogEntries: boolean;
  performanceInfo: FeedbackPerformanceInfo;
  processInfo: FeedbackProcessInfo;
  accessibilityInfo: FeedbackAccessibilityInfo;
  displayInfo: FeedbackDisplayInfo;
  settingsSnapshot: Record<string, string>;
  emergencyCrashReports: string[];
  recentLogs: string[];
  recentErrors: string[];
}

const VALID_STATUSES = new Set(["open", "in_progress", "resolved", "closed"]);
const VALID_PRIORITIES = new Set(["low", "medium", "high", "critical"]);

export const DEFAULT_DISPLAY_INFO: FeedbackDisplayInfo = {
  count: 0,
  displays: [],
  mainDisplayIndex: 0,
};

export const DEFAULT_PROCESS_INFO: FeedbackProcessInfo = {
  totalRunning: 0,
  eventMonitoringApps: 0,
  windowManagementApps: 0,
  securityApps: 0,
  hasJamf: false,
  hasKandji: false,
  axuiServerCPU: 0,
  windowServerCPU: 0,
};

export const DEFAULT_ACCESSIBILITY_INFO: FeedbackAccessibilityInfo = {
  voiceOverEnabled: false,
  switchControlEnabled: false,
  reduceMotionEnabled: false,
  increaseContrastEnabled: false,
  reduceTransparencyEnabled: false,
  differentiateWithoutColorEnabled: false,
  displayHasInvertedColors: false,
};

export const DEFAULT_PERFORMANCE_INFO: FeedbackPerformanceInfo = {
  cpuUsagePercent: 0,
  memoryUsedGB: 0,
  memoryTotalGB: 0,
  memoryPressure: "unknown",
  swapUsedGB: 0,
  thermalState: "unknown",
  processorCount: 0,
  isLowPowerModeEnabled: false,
  powerSource: "unknown",
  batteryLevel: null,
};

export function stringifyJson(value: unknown, fallback: unknown): string {
  try {
    return JSON.stringify(value ?? fallback);
  } catch {
    return JSON.stringify(fallback);
  }
}

export function parseJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string" || value.length === 0) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function toStringValue(value: unknown, fallback = ""): string {
  if (value === null || value === undefined) {
    return fallback;
  }
  return String(value);
}

function toNumber(value: unknown, fallback = 0): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toInteger(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return Math.trunc(parsed);
}

function toBoolean(value: unknown): boolean {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return value === 1;
  }
  if (typeof value === "string") {
    return value === "1" || value.toLowerCase() === "true";
  }
  return false;
}

function normalizeStringArray(values: unknown): string[] {
  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .map((value) => toStringValue(value).trim())
    .filter((value) => value.length > 0);
}

function hasStructuredPayload(rawValue: unknown): boolean {
  if (typeof rawValue !== "string") {
    return false;
  }

  const value = rawValue.trim();
  if (value.length === 0) {
    return false;
  }

  return value !== "null" && value !== "{}" && value !== "[]";
}

function normalizeSettingsSnapshot(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const settings: Record<string, string> = {};
  for (const [key, rawValue] of Object.entries(value as Record<string, unknown>)) {
    settings[String(key)] = toStringValue(rawValue);
  }

  return settings;
}

function normalizeDisplayInfo(value: FeedbackDisplayInfo | undefined): FeedbackDisplayInfo {
  if (!value || typeof value !== "object") {
    return { ...DEFAULT_DISPLAY_INFO, displays: [] };
  }

  const normalizedDisplays = Array.isArray(value.displays)
    ? value.displays.map((display) => ({
        index: toNumber(display?.index, 0),
        resolution: toStringValue(display?.resolution),
        backingScaleFactor: toStringValue(display?.backingScaleFactor),
        colorSpace: toStringValue(display?.colorSpace),
        refreshRate: toStringValue(display?.refreshRate),
        isRetina: toBoolean(display?.isRetina),
        frame: toStringValue(display?.frame),
      }))
    : [];

  const providedCount = toNumber(value.count, normalizedDisplays.length);
  const count = Math.max(0, Math.max(Math.trunc(providedCount), normalizedDisplays.length));

  return {
    count,
    displays: normalizedDisplays,
    mainDisplayIndex: toNumber(value.mainDisplayIndex, 0),
  };
}

function normalizeProcessInfo(value: FeedbackProcessInfo | undefined): FeedbackProcessInfo {
  if (!value || typeof value !== "object") {
    return { ...DEFAULT_PROCESS_INFO };
  }

  return {
    totalRunning: toNumber(value.totalRunning, 0),
    eventMonitoringApps: toNumber(value.eventMonitoringApps, 0),
    windowManagementApps: toNumber(value.windowManagementApps, 0),
    securityApps: toNumber(value.securityApps, 0),
    hasJamf: toBoolean(value.hasJamf),
    hasKandji: toBoolean(value.hasKandji),
    axuiServerCPU: toNumber(value.axuiServerCPU, 0),
    windowServerCPU: toNumber(value.windowServerCPU, 0),
  };
}

function normalizeAccessibilityInfo(value: FeedbackAccessibilityInfo | undefined): FeedbackAccessibilityInfo {
  if (!value || typeof value !== "object") {
    return { ...DEFAULT_ACCESSIBILITY_INFO };
  }

  return {
    voiceOverEnabled: toBoolean(value.voiceOverEnabled),
    switchControlEnabled: toBoolean(value.switchControlEnabled),
    reduceMotionEnabled: toBoolean(value.reduceMotionEnabled),
    increaseContrastEnabled: toBoolean(value.increaseContrastEnabled),
    reduceTransparencyEnabled: toBoolean(value.reduceTransparencyEnabled),
    differentiateWithoutColorEnabled: toBoolean(value.differentiateWithoutColorEnabled),
    displayHasInvertedColors: toBoolean(value.displayHasInvertedColors),
  };
}

function normalizePerformanceInfo(value: FeedbackPerformanceInfo | undefined): FeedbackPerformanceInfo {
  if (!value || typeof value !== "object") {
    return { ...DEFAULT_PERFORMANCE_INFO };
  }

  const batteryLevelRaw = toInteger(value.batteryLevel);

  return {
    cpuUsagePercent: toNumber(value.cpuUsagePercent, 0),
    memoryUsedGB: toNumber(value.memoryUsedGB, 0),
    memoryTotalGB: toNumber(value.memoryTotalGB, 0),
    memoryPressure: toStringValue(value.memoryPressure, "unknown"),
    swapUsedGB: toNumber(value.swapUsedGB, 0),
    thermalState: toStringValue(value.thermalState, "unknown"),
    processorCount: toNumber(value.processorCount, 0),
    isLowPowerModeEnabled: toBoolean(value.isLowPowerModeEnabled),
    powerSource: toStringValue(value.powerSource, "unknown"),
    batteryLevel: batteryLevelRaw === null ? null : batteryLevelRaw,
  };
}

function hasProcessData(value: FeedbackProcessInfo): boolean {
  return (
    value.totalRunning !== DEFAULT_PROCESS_INFO.totalRunning ||
    value.eventMonitoringApps !== DEFAULT_PROCESS_INFO.eventMonitoringApps ||
    value.windowManagementApps !== DEFAULT_PROCESS_INFO.windowManagementApps ||
    value.securityApps !== DEFAULT_PROCESS_INFO.securityApps ||
    value.hasJamf !== DEFAULT_PROCESS_INFO.hasJamf ||
    value.hasKandji !== DEFAULT_PROCESS_INFO.hasKandji ||
    value.axuiServerCPU !== DEFAULT_PROCESS_INFO.axuiServerCPU ||
    value.windowServerCPU !== DEFAULT_PROCESS_INFO.windowServerCPU
  );
}

function hasAccessibilityData(value: FeedbackAccessibilityInfo): boolean {
  return (
    value.voiceOverEnabled ||
    value.switchControlEnabled ||
    value.reduceMotionEnabled ||
    value.increaseContrastEnabled ||
    value.reduceTransparencyEnabled ||
    value.differentiateWithoutColorEnabled ||
    value.displayHasInvertedColors
  );
}

function hasPerformanceData(value: FeedbackPerformanceInfo): boolean {
  return (
    value.cpuUsagePercent !== DEFAULT_PERFORMANCE_INFO.cpuUsagePercent ||
    value.memoryUsedGB !== DEFAULT_PERFORMANCE_INFO.memoryUsedGB ||
    value.memoryTotalGB !== DEFAULT_PERFORMANCE_INFO.memoryTotalGB ||
    value.memoryPressure !== DEFAULT_PERFORMANCE_INFO.memoryPressure ||
    value.swapUsedGB !== DEFAULT_PERFORMANCE_INFO.swapUsedGB ||
    value.thermalState !== DEFAULT_PERFORMANCE_INFO.thermalState ||
    value.processorCount !== DEFAULT_PERFORMANCE_INFO.processorCount ||
    value.isLowPowerModeEnabled !== DEFAULT_PERFORMANCE_INFO.isLowPowerModeEnabled ||
    value.powerSource !== DEFAULT_PERFORMANCE_INFO.powerSource ||
    value.batteryLevel !== DEFAULT_PERFORMANCE_INFO.batteryLevel
  );
}

function getOrCreateState(map: Map<number, NormalizedDiagnosticsState>, feedbackId: number): NormalizedDiagnosticsState {
  const existing = map.get(feedbackId);
  if (existing) {
    return existing;
  }

  const state: NormalizedDiagnosticsState = {
    hasPerformance: false,
    hasProcess: false,
    hasAccessibility: false,
    hasDisplays: false,
    hasSettings: false,
    hasCrashReports: false,
    hasLogEntries: false,
    performanceInfo: { ...DEFAULT_PERFORMANCE_INFO },
    processInfo: { ...DEFAULT_PROCESS_INFO },
    accessibilityInfo: { ...DEFAULT_ACCESSIBILITY_INFO },
    displayInfo: { ...DEFAULT_DISPLAY_INFO, displays: [] },
    settingsSnapshot: {},
    emergencyCrashReports: [],
    recentLogs: [],
    recentErrors: [],
  };

  map.set(feedbackId, state);
  return state;
}

function buildInClause(ids: number[]): string {
  return ids.map(() => "?").join(", ");
}

function uniqueFeedbackIds(feedbackIds: number[]): number[] {
  return Array.from(
    new Set(
      feedbackIds
        .map((id) => Math.trunc(id))
        .filter((id) => Number.isFinite(id) && id > 0)
    )
  );
}

export async function ensureFeedbackDiagnosticsTables(database: Client): Promise<void> {
  await database.execute(`
    CREATE TABLE IF NOT EXISTS feedback_performance (
      feedback_id INTEGER PRIMARY KEY,
      cpu_usage_percent REAL NOT NULL DEFAULT 0,
      memory_used_gb REAL NOT NULL DEFAULT 0,
      memory_total_gb REAL NOT NULL DEFAULT 0,
      memory_pressure TEXT NOT NULL DEFAULT 'unknown',
      swap_used_gb REAL NOT NULL DEFAULT 0,
      thermal_state TEXT NOT NULL DEFAULT 'unknown',
      processor_count INTEGER NOT NULL DEFAULT 0,
      is_low_power_mode_enabled INTEGER NOT NULL DEFAULT 0,
      power_source TEXT NOT NULL DEFAULT 'unknown',
      battery_level INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (feedback_id) REFERENCES feedback(id) ON DELETE CASCADE
    )
  `);

  await database.execute(`
    CREATE TABLE IF NOT EXISTS feedback_process (
      feedback_id INTEGER PRIMARY KEY,
      total_running INTEGER NOT NULL DEFAULT 0,
      event_monitoring_apps INTEGER NOT NULL DEFAULT 0,
      window_management_apps INTEGER NOT NULL DEFAULT 0,
      security_apps INTEGER NOT NULL DEFAULT 0,
      has_jamf INTEGER NOT NULL DEFAULT 0,
      has_kandji INTEGER NOT NULL DEFAULT 0,
      axui_server_cpu REAL NOT NULL DEFAULT 0,
      window_server_cpu REAL NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (feedback_id) REFERENCES feedback(id) ON DELETE CASCADE
    )
  `);

  await database.execute(`
    CREATE TABLE IF NOT EXISTS feedback_accessibility (
      feedback_id INTEGER PRIMARY KEY,
      voice_over_enabled INTEGER NOT NULL DEFAULT 0,
      switch_control_enabled INTEGER NOT NULL DEFAULT 0,
      reduce_motion_enabled INTEGER NOT NULL DEFAULT 0,
      increase_contrast_enabled INTEGER NOT NULL DEFAULT 0,
      reduce_transparency_enabled INTEGER NOT NULL DEFAULT 0,
      differentiate_without_color_enabled INTEGER NOT NULL DEFAULT 0,
      display_has_inverted_colors INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (feedback_id) REFERENCES feedback(id) ON DELETE CASCADE
    )
  `);

  await database.execute(`
    CREATE TABLE IF NOT EXISTS feedback_displays (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      feedback_id INTEGER NOT NULL,
      row_index INTEGER NOT NULL,
      display_index INTEGER NOT NULL DEFAULT 0,
      resolution TEXT NOT NULL DEFAULT '',
      backing_scale_factor TEXT NOT NULL DEFAULT '',
      color_space TEXT NOT NULL DEFAULT '',
      refresh_rate TEXT NOT NULL DEFAULT '',
      is_retina INTEGER NOT NULL DEFAULT 0,
      frame TEXT NOT NULL DEFAULT '',
      is_main_display INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (feedback_id) REFERENCES feedback(id) ON DELETE CASCADE,
      UNIQUE (feedback_id, row_index)
    )
  `);

  await database.execute(`
    CREATE TABLE IF NOT EXISTS feedback_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      feedback_id INTEGER NOT NULL,
      setting_key TEXT NOT NULL,
      setting_value TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (feedback_id) REFERENCES feedback(id) ON DELETE CASCADE,
      UNIQUE (feedback_id, setting_key)
    )
  `);

  await database.execute(`
    CREATE TABLE IF NOT EXISTS feedback_crash_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      feedback_id INTEGER NOT NULL,
      report_index INTEGER NOT NULL,
      report_text TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (feedback_id) REFERENCES feedback(id) ON DELETE CASCADE,
      UNIQUE (feedback_id, report_index)
    )
  `);

  await database.execute(`
    CREATE TABLE IF NOT EXISTS feedback_log_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      feedback_id INTEGER NOT NULL,
      level TEXT NOT NULL,
      entry_index INTEGER NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (feedback_id) REFERENCES feedback(id) ON DELETE CASCADE,
      UNIQUE (feedback_id, level, entry_index)
    )
  `);

  await database.execute(`CREATE INDEX IF NOT EXISTS idx_feedback_performance_memory_pressure ON feedback_performance(memory_pressure)`);
  await database.execute(`CREATE INDEX IF NOT EXISTS idx_feedback_performance_feedback_id ON feedback_performance(feedback_id)`);
  await database.execute(`CREATE INDEX IF NOT EXISTS idx_feedback_process_has_jamf ON feedback_process(has_jamf)`);
  await database.execute(`CREATE INDEX IF NOT EXISTS idx_feedback_process_has_kandji ON feedback_process(has_kandji)`);
  await database.execute(`CREATE INDEX IF NOT EXISTS idx_feedback_process_feedback_id ON feedback_process(feedback_id)`);
  await database.execute(`CREATE INDEX IF NOT EXISTS idx_feedback_accessibility_feedback_id ON feedback_accessibility(feedback_id)`);
  await database.execute(`CREATE INDEX IF NOT EXISTS idx_feedback_displays_feedback_id ON feedback_displays(feedback_id)`);
  await database.execute(`CREATE INDEX IF NOT EXISTS idx_feedback_displays_display_index ON feedback_displays(display_index)`);
  await database.execute(`CREATE INDEX IF NOT EXISTS idx_feedback_settings_feedback_id ON feedback_settings(feedback_id)`);
  await database.execute(`CREATE INDEX IF NOT EXISTS idx_feedback_settings_setting_key ON feedback_settings(setting_key)`);
  await database.execute(`CREATE INDEX IF NOT EXISTS idx_feedback_crash_reports_feedback_id ON feedback_crash_reports(feedback_id)`);
  await database.execute(`CREATE INDEX IF NOT EXISTS idx_feedback_log_entries_feedback_id ON feedback_log_entries(feedback_id)`);
  await database.execute(`CREATE INDEX IF NOT EXISTS idx_feedback_log_entries_level ON feedback_log_entries(level)`);
}

export async function upsertFeedbackDiagnostics(
  database: Client,
  feedbackId: number,
  diagnostics: FeedbackDiagnosticsPayload,
  options: UpsertFeedbackDiagnosticsOptions = {}
): Promise<{ displayCount: number }> {
  const writePerformance = options.writePerformance ?? true;
  const writeProcess = options.writeProcess ?? true;
  const writeAccessibility = options.writeAccessibility ?? true;
  const writeDisplays = options.writeDisplays ?? true;
  const writeSettings = options.writeSettings ?? true;
  const writeCrashReports = options.writeCrashReports ?? true;
  const writeLogEntries = options.writeLogEntries ?? true;

  const normalizedDisplayInfo = normalizeDisplayInfo(diagnostics.displayInfo);
  const normalizedProcessInfo = normalizeProcessInfo(diagnostics.processInfo);
  const normalizedAccessibilityInfo = normalizeAccessibilityInfo(diagnostics.accessibilityInfo);
  const normalizedPerformanceInfo = normalizePerformanceInfo(diagnostics.performanceInfo);
  const normalizedSettingsSnapshot = normalizeSettingsSnapshot(diagnostics.settingsSnapshot);
  const normalizedCrashReports = normalizeStringArray(diagnostics.emergencyCrashReports);
  const normalizedRecentLogs = normalizeStringArray(diagnostics.recentLogs);
  const normalizedRecentErrors = normalizeStringArray(diagnostics.recentErrors);

  const displayCount = Math.max(
    normalizedDisplayInfo.count,
    normalizedDisplayInfo.displays.length
  );

  if (writePerformance) {
    await database.execute({
      sql: `
        INSERT INTO feedback_performance (
          feedback_id, cpu_usage_percent, memory_used_gb, memory_total_gb,
          memory_pressure, swap_used_gb, thermal_state, processor_count,
          is_low_power_mode_enabled, power_source, battery_level
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(feedback_id) DO UPDATE SET
          cpu_usage_percent = excluded.cpu_usage_percent,
          memory_used_gb = excluded.memory_used_gb,
          memory_total_gb = excluded.memory_total_gb,
          memory_pressure = excluded.memory_pressure,
          swap_used_gb = excluded.swap_used_gb,
          thermal_state = excluded.thermal_state,
          processor_count = excluded.processor_count,
          is_low_power_mode_enabled = excluded.is_low_power_mode_enabled,
          power_source = excluded.power_source,
          battery_level = excluded.battery_level,
          updated_at = datetime('now')
      `,
      args: [
        feedbackId,
        normalizedPerformanceInfo.cpuUsagePercent,
        normalizedPerformanceInfo.memoryUsedGB,
        normalizedPerformanceInfo.memoryTotalGB,
        normalizedPerformanceInfo.memoryPressure,
        normalizedPerformanceInfo.swapUsedGB,
        normalizedPerformanceInfo.thermalState,
        normalizedPerformanceInfo.processorCount,
        normalizedPerformanceInfo.isLowPowerModeEnabled ? 1 : 0,
        normalizedPerformanceInfo.powerSource,
        normalizedPerformanceInfo.batteryLevel,
      ],
    });
  }

  if (writeProcess) {
    await database.execute({
      sql: `
        INSERT INTO feedback_process (
          feedback_id, total_running, event_monitoring_apps, window_management_apps,
          security_apps, has_jamf, has_kandji, axui_server_cpu, window_server_cpu
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(feedback_id) DO UPDATE SET
          total_running = excluded.total_running,
          event_monitoring_apps = excluded.event_monitoring_apps,
          window_management_apps = excluded.window_management_apps,
          security_apps = excluded.security_apps,
          has_jamf = excluded.has_jamf,
          has_kandji = excluded.has_kandji,
          axui_server_cpu = excluded.axui_server_cpu,
          window_server_cpu = excluded.window_server_cpu,
          updated_at = datetime('now')
      `,
      args: [
        feedbackId,
        normalizedProcessInfo.totalRunning,
        normalizedProcessInfo.eventMonitoringApps,
        normalizedProcessInfo.windowManagementApps,
        normalizedProcessInfo.securityApps,
        normalizedProcessInfo.hasJamf ? 1 : 0,
        normalizedProcessInfo.hasKandji ? 1 : 0,
        normalizedProcessInfo.axuiServerCPU,
        normalizedProcessInfo.windowServerCPU,
      ],
    });
  }

  if (writeAccessibility) {
    await database.execute({
      sql: `
        INSERT INTO feedback_accessibility (
          feedback_id, voice_over_enabled, switch_control_enabled, reduce_motion_enabled,
          increase_contrast_enabled, reduce_transparency_enabled,
          differentiate_without_color_enabled, display_has_inverted_colors
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(feedback_id) DO UPDATE SET
          voice_over_enabled = excluded.voice_over_enabled,
          switch_control_enabled = excluded.switch_control_enabled,
          reduce_motion_enabled = excluded.reduce_motion_enabled,
          increase_contrast_enabled = excluded.increase_contrast_enabled,
          reduce_transparency_enabled = excluded.reduce_transparency_enabled,
          differentiate_without_color_enabled = excluded.differentiate_without_color_enabled,
          display_has_inverted_colors = excluded.display_has_inverted_colors,
          updated_at = datetime('now')
      `,
      args: [
        feedbackId,
        normalizedAccessibilityInfo.voiceOverEnabled ? 1 : 0,
        normalizedAccessibilityInfo.switchControlEnabled ? 1 : 0,
        normalizedAccessibilityInfo.reduceMotionEnabled ? 1 : 0,
        normalizedAccessibilityInfo.increaseContrastEnabled ? 1 : 0,
        normalizedAccessibilityInfo.reduceTransparencyEnabled ? 1 : 0,
        normalizedAccessibilityInfo.differentiateWithoutColorEnabled ? 1 : 0,
        normalizedAccessibilityInfo.displayHasInvertedColors ? 1 : 0,
      ],
    });
  }

  if (writeDisplays) {
    await database.execute({
      sql: "DELETE FROM feedback_displays WHERE feedback_id = ?",
      args: [feedbackId],
    });

    for (let index = 0; index < normalizedDisplayInfo.displays.length; index += 1) {
      const display = normalizedDisplayInfo.displays[index];
      await database.execute({
        sql: `
          INSERT INTO feedback_displays (
            feedback_id, row_index, display_index, resolution, backing_scale_factor,
            color_space, refresh_rate, is_retina, frame, is_main_display
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        args: [
          feedbackId,
          index,
          display.index,
          display.resolution,
          display.backingScaleFactor,
          display.colorSpace,
          display.refreshRate,
          display.isRetina ? 1 : 0,
          display.frame,
          display.index === normalizedDisplayInfo.mainDisplayIndex ? 1 : 0,
        ],
      });
    }
  }

  if (writeSettings) {
    await database.execute({
      sql: "DELETE FROM feedback_settings WHERE feedback_id = ?",
      args: [feedbackId],
    });

    const settingEntries = Object.entries(normalizedSettingsSnapshot).sort((a, b) =>
      a[0].localeCompare(b[0])
    );

    for (const [settingKey, settingValue] of settingEntries) {
      await database.execute({
        sql: `
          INSERT INTO feedback_settings (feedback_id, setting_key, setting_value)
          VALUES (?, ?, ?)
        `,
        args: [feedbackId, settingKey, settingValue],
      });
    }
  }

  if (writeCrashReports) {
    await database.execute({
      sql: "DELETE FROM feedback_crash_reports WHERE feedback_id = ?",
      args: [feedbackId],
    });

    for (let index = 0; index < normalizedCrashReports.length; index += 1) {
      await database.execute({
        sql: `
          INSERT INTO feedback_crash_reports (feedback_id, report_index, report_text)
          VALUES (?, ?, ?)
        `,
        args: [feedbackId, index, normalizedCrashReports[index]],
      });
    }
  }

  if (writeLogEntries) {
    await database.execute({
      sql: "DELETE FROM feedback_log_entries WHERE feedback_id = ?",
      args: [feedbackId],
    });

    for (let index = 0; index < normalizedRecentLogs.length; index += 1) {
      await database.execute({
        sql: `
          INSERT INTO feedback_log_entries (feedback_id, level, entry_index, message)
          VALUES (?, 'log', ?, ?)
        `,
        args: [feedbackId, index, normalizedRecentLogs[index]],
      });
    }

    for (let index = 0; index < normalizedRecentErrors.length; index += 1) {
      await database.execute({
        sql: `
          INSERT INTO feedback_log_entries (feedback_id, level, entry_index, message)
          VALUES (?, 'error', ?, ?)
        `,
        args: [feedbackId, index, normalizedRecentErrors[index]],
      });
    }
  }

  if (writeDisplays) {
    await database.execute({
      sql: "UPDATE feedback SET display_count = ? WHERE id = ?",
      args: [displayCount, feedbackId],
    });
  }

  return { displayCount };
}

export async function getNormalizedDiagnosticsByFeedbackIds(
  database: Client,
  feedbackIds: number[]
): Promise<Map<number, NormalizedDiagnosticsState>> {
  const ids = uniqueFeedbackIds(feedbackIds);
  if (ids.length === 0) {
    return new Map<number, NormalizedDiagnosticsState>();
  }

  const placeholders = buildInClause(ids);
  const diagnosticsById = new Map<number, NormalizedDiagnosticsState>();

  const performanceResult = await database.execute({
    sql: `
      SELECT
        feedback_id,
        cpu_usage_percent,
        memory_used_gb,
        memory_total_gb,
        memory_pressure,
        swap_used_gb,
        thermal_state,
        processor_count,
        is_low_power_mode_enabled,
        power_source,
        battery_level
      FROM feedback_performance
      WHERE feedback_id IN (${placeholders})
    `,
    args: ids,
  });

  for (const row of performanceResult.rows as Record<string, unknown>[]) {
    const feedbackId = toInteger(row.feedback_id);
    if (feedbackId === null) {
      continue;
    }

    const state = getOrCreateState(diagnosticsById, feedbackId);
    state.hasPerformance = true;
    state.performanceInfo = {
      cpuUsagePercent: toNumber(row.cpu_usage_percent, 0),
      memoryUsedGB: toNumber(row.memory_used_gb, 0),
      memoryTotalGB: toNumber(row.memory_total_gb, 0),
      memoryPressure: toStringValue(row.memory_pressure, "unknown"),
      swapUsedGB: toNumber(row.swap_used_gb, 0),
      thermalState: toStringValue(row.thermal_state, "unknown"),
      processorCount: toNumber(row.processor_count, 0),
      isLowPowerModeEnabled: toBoolean(row.is_low_power_mode_enabled),
      powerSource: toStringValue(row.power_source, "unknown"),
      batteryLevel: toInteger(row.battery_level),
    };
  }

  const processResult = await database.execute({
    sql: `
      SELECT
        feedback_id,
        total_running,
        event_monitoring_apps,
        window_management_apps,
        security_apps,
        has_jamf,
        has_kandji,
        axui_server_cpu,
        window_server_cpu
      FROM feedback_process
      WHERE feedback_id IN (${placeholders})
    `,
    args: ids,
  });

  for (const row of processResult.rows as Record<string, unknown>[]) {
    const feedbackId = toInteger(row.feedback_id);
    if (feedbackId === null) {
      continue;
    }

    const state = getOrCreateState(diagnosticsById, feedbackId);
    state.hasProcess = true;
    state.processInfo = {
      totalRunning: toNumber(row.total_running, 0),
      eventMonitoringApps: toNumber(row.event_monitoring_apps, 0),
      windowManagementApps: toNumber(row.window_management_apps, 0),
      securityApps: toNumber(row.security_apps, 0),
      hasJamf: toBoolean(row.has_jamf),
      hasKandji: toBoolean(row.has_kandji),
      axuiServerCPU: toNumber(row.axui_server_cpu, 0),
      windowServerCPU: toNumber(row.window_server_cpu, 0),
    };
  }

  const accessibilityResult = await database.execute({
    sql: `
      SELECT
        feedback_id,
        voice_over_enabled,
        switch_control_enabled,
        reduce_motion_enabled,
        increase_contrast_enabled,
        reduce_transparency_enabled,
        differentiate_without_color_enabled,
        display_has_inverted_colors
      FROM feedback_accessibility
      WHERE feedback_id IN (${placeholders})
    `,
    args: ids,
  });

  for (const row of accessibilityResult.rows as Record<string, unknown>[]) {
    const feedbackId = toInteger(row.feedback_id);
    if (feedbackId === null) {
      continue;
    }

    const state = getOrCreateState(diagnosticsById, feedbackId);
    state.hasAccessibility = true;
    state.accessibilityInfo = {
      voiceOverEnabled: toBoolean(row.voice_over_enabled),
      switchControlEnabled: toBoolean(row.switch_control_enabled),
      reduceMotionEnabled: toBoolean(row.reduce_motion_enabled),
      increaseContrastEnabled: toBoolean(row.increase_contrast_enabled),
      reduceTransparencyEnabled: toBoolean(row.reduce_transparency_enabled),
      differentiateWithoutColorEnabled: toBoolean(row.differentiate_without_color_enabled),
      displayHasInvertedColors: toBoolean(row.display_has_inverted_colors),
    };
  }

  const displayResult = await database.execute({
    sql: `
      SELECT
        feedback_id,
        row_index,
        display_index,
        resolution,
        backing_scale_factor,
        color_space,
        refresh_rate,
        is_retina,
        frame,
        is_main_display
      FROM feedback_displays
      WHERE feedback_id IN (${placeholders})
      ORDER BY feedback_id ASC, row_index ASC
    `,
    args: ids,
  });

  for (const row of displayResult.rows as Record<string, unknown>[]) {
    const feedbackId = toInteger(row.feedback_id);
    if (feedbackId === null) {
      continue;
    }

    const state = getOrCreateState(diagnosticsById, feedbackId);
    state.hasDisplays = true;
    state.displayInfo.displays.push({
      index: toNumber(row.display_index, 0),
      resolution: toStringValue(row.resolution),
      backingScaleFactor: toStringValue(row.backing_scale_factor),
      colorSpace: toStringValue(row.color_space),
      refreshRate: toStringValue(row.refresh_rate),
      isRetina: toBoolean(row.is_retina),
      frame: toStringValue(row.frame),
    });

    if (toBoolean(row.is_main_display)) {
      state.displayInfo.mainDisplayIndex = toNumber(row.display_index, 0);
    }
  }

  const settingResult = await database.execute({
    sql: `
      SELECT feedback_id, setting_key, setting_value
      FROM feedback_settings
      WHERE feedback_id IN (${placeholders})
      ORDER BY feedback_id ASC, setting_key ASC
    `,
    args: ids,
  });

  for (const row of settingResult.rows as Record<string, unknown>[]) {
    const feedbackId = toInteger(row.feedback_id);
    if (feedbackId === null) {
      continue;
    }

    const state = getOrCreateState(diagnosticsById, feedbackId);
    state.hasSettings = true;
    state.settingsSnapshot[toStringValue(row.setting_key)] = toStringValue(row.setting_value);
  }

  const crashResult = await database.execute({
    sql: `
      SELECT feedback_id, report_index, report_text
      FROM feedback_crash_reports
      WHERE feedback_id IN (${placeholders})
      ORDER BY feedback_id ASC, report_index ASC
    `,
    args: ids,
  });

  for (const row of crashResult.rows as Record<string, unknown>[]) {
    const feedbackId = toInteger(row.feedback_id);
    if (feedbackId === null) {
      continue;
    }

    const state = getOrCreateState(diagnosticsById, feedbackId);
    state.hasCrashReports = true;
    state.emergencyCrashReports.push(toStringValue(row.report_text));
  }

  const logResult = await database.execute({
    sql: `
      SELECT feedback_id, level, entry_index, message
      FROM feedback_log_entries
      WHERE feedback_id IN (${placeholders})
      ORDER BY feedback_id ASC, level ASC, entry_index ASC
    `,
    args: ids,
  });

  for (const row of logResult.rows as Record<string, unknown>[]) {
    const feedbackId = toInteger(row.feedback_id);
    if (feedbackId === null) {
      continue;
    }

    const state = getOrCreateState(diagnosticsById, feedbackId);
    state.hasLogEntries = true;

    const level = toStringValue(row.level).toLowerCase();
    const message = toStringValue(row.message);
    if (level === "error") {
      state.recentErrors.push(message);
    } else {
      state.recentLogs.push(message);
    }
  }

  for (const state of diagnosticsById.values()) {
    state.displayInfo.count = state.displayInfo.displays.length;
  }

  return diagnosticsById;
}

function parseLegacySettings(row: Record<string, unknown>): Record<string, string> {
  const parsed = parseJson<Record<string, unknown>>(row.settings_snapshot, {});
  return normalizeSettingsSnapshot(parsed);
}

function parseLegacyDisplayInfo(row: Record<string, unknown>): FeedbackDisplayInfo {
  const parsed = parseJson<FeedbackDisplayInfo>(row.display_info, DEFAULT_DISPLAY_INFO);
  return normalizeDisplayInfo(parsed);
}

function parseLegacyProcessInfo(row: Record<string, unknown>): FeedbackProcessInfo {
  const parsed = parseJson<FeedbackProcessInfo>(row.process_info, DEFAULT_PROCESS_INFO);
  return normalizeProcessInfo(parsed);
}

function parseLegacyAccessibilityInfo(row: Record<string, unknown>): FeedbackAccessibilityInfo {
  const parsed = parseJson<FeedbackAccessibilityInfo>(row.accessibility_info, DEFAULT_ACCESSIBILITY_INFO);
  return normalizeAccessibilityInfo(parsed);
}

function parseLegacyPerformanceInfo(row: Record<string, unknown>): FeedbackPerformanceInfo {
  const parsed = parseJson<FeedbackPerformanceInfo>(row.performance_info, DEFAULT_PERFORMANCE_INFO);
  return normalizePerformanceInfo(parsed);
}

function parseLegacyCrashReports(row: Record<string, unknown>): string[] {
  return normalizeStringArray(parseJson<string[]>(row.emergency_crash_reports, []));
}

function parseLegacyLogs(row: Record<string, unknown>): string[] {
  return normalizeStringArray(parseJson<string[]>(row.recent_logs, []));
}

function parseLegacyErrors(row: Record<string, unknown>): string[] {
  return normalizeStringArray(parseJson<string[]>(row.recent_errors, []));
}

export function mapFeedbackRowToApiItem(
  rawRow: Record<string, unknown>,
  normalizedDiagnostics: NormalizedDiagnosticsState | undefined
): FeedbackApiItem {
  const id = toInteger(rawRow.id) ?? 0;
  const createdAt = toStringValue(rawRow.created_at);
  const updatedAt = toStringValue(rawRow.updated_at, createdAt);
  const status = toStringValue(rawRow.status, "open");
  const priority = toStringValue(rawRow.priority, "medium");

  const legacyDisplayInfo = parseLegacyDisplayInfo(rawRow);
  const displayInfo = normalizedDiagnostics?.hasDisplays
    ? {
        ...normalizedDiagnostics.displayInfo,
        displays: [...normalizedDiagnostics.displayInfo.displays],
      }
    : legacyDisplayInfo;

  const displayCountFromRow = toInteger(rawRow.display_count);
  const displayCount = Math.max(
    displayCountFromRow ?? displayInfo.count,
    displayInfo.displays.length
  );

  const effectiveDisplayInfo: FeedbackDisplayInfo = {
    ...displayInfo,
    count: displayCount,
  };

  const tags = parseJson<string[]>(rawRow.tags, [])
    .map((tag) => toStringValue(tag).trim())
    .filter((tag) => tag.length > 0);

  const recentLogs = normalizedDiagnostics?.hasLogEntries
    ? normalizedDiagnostics.recentLogs
    : parseLegacyLogs(rawRow);

  const recentErrors = normalizedDiagnostics?.hasLogEntries
    ? normalizedDiagnostics.recentErrors
    : parseLegacyErrors(rawRow);

  return {
    id,
    type: toStringValue(rawRow.type),
    email: rawRow.email === null || rawRow.email === undefined ? null : toStringValue(rawRow.email),
    description: toStringValue(rawRow.description),
    isRead: toBoolean(rawRow.is_read),
    status: VALID_STATUSES.has(status) ? (status as FeedbackApiItem["status"]) : "open",
    priority: VALID_PRIORITIES.has(priority) ? (priority as FeedbackApiItem["priority"]) : "medium",
    notes: toStringValue(rawRow.notes),
    tags,
    appVersion: toStringValue(rawRow.app_version),
    buildNumber: toStringValue(rawRow.build_number),
    macOSVersion: toStringValue(rawRow.macos_version),
    deviceModel: toStringValue(rawRow.device_model),
    totalDiskSpace: toStringValue(rawRow.total_disk_space),
    freeDiskSpace: toStringValue(rawRow.free_disk_space),
    databaseStats: {
      sessionCount: toNumber(rawRow.session_count, 0),
      frameCount: toNumber(rawRow.frame_count, 0),
      segmentCount: toNumber(rawRow.segment_count, 0),
      databaseSizeMB: toNumber(rawRow.database_size_mb, 0),
    },
    recentErrors,
    recentLogs,
    diagnosticsTimestamp:
      rawRow.diagnostics_timestamp === null || rawRow.diagnostics_timestamp === undefined
        ? null
        : toStringValue(rawRow.diagnostics_timestamp),
    settingsSnapshot: normalizedDiagnostics?.hasSettings
      ? normalizedDiagnostics.settingsSnapshot
      : parseLegacySettings(rawRow),
    displayCount,
    displayInfo: effectiveDisplayInfo,
    processInfo: normalizedDiagnostics?.hasProcess
      ? normalizedDiagnostics.processInfo
      : parseLegacyProcessInfo(rawRow),
    accessibilityInfo: normalizedDiagnostics?.hasAccessibility
      ? normalizedDiagnostics.accessibilityInfo
      : parseLegacyAccessibilityInfo(rawRow),
    performanceInfo: normalizedDiagnostics?.hasPerformance
      ? normalizedDiagnostics.performanceInfo
      : parseLegacyPerformanceInfo(rawRow),
    emergencyCrashReports: normalizedDiagnostics?.hasCrashReports
      ? normalizedDiagnostics.emergencyCrashReports
      : parseLegacyCrashReports(rawRow),
    hasScreenshot: toBoolean(rawRow.has_screenshot),
    createdAt,
    updatedAt,
  };
}

export async function hasLegacyDiagnosticsSourceData(database: Client): Promise<boolean> {
  const result = await database.execute(`
    SELECT id
    FROM feedback
    WHERE
      COALESCE(TRIM(recent_errors), '') NOT IN ('', '[]', 'null') OR
      COALESCE(TRIM(recent_logs), '') NOT IN ('', '[]', 'null') OR
      COALESCE(TRIM(settings_snapshot), '') NOT IN ('', '{}', 'null') OR
      COALESCE(TRIM(display_info), '') NOT IN ('', '{}', 'null') OR
      COALESCE(TRIM(process_info), '') NOT IN ('', '{}', 'null') OR
      COALESCE(TRIM(accessibility_info), '') NOT IN ('', '{}', 'null') OR
      COALESCE(TRIM(performance_info), '') NOT IN ('', '{}', 'null') OR
      COALESCE(TRIM(emergency_crash_reports), '') NOT IN ('', '[]', 'null')
    LIMIT 1
  `);

  return result.rows.length > 0;
}

export async function backfillLegacyDiagnostics(database: Client): Promise<void> {
  const result = await database.execute(`
    SELECT
      id,
      settings_snapshot,
      display_info,
      process_info,
      accessibility_info,
      performance_info,
      emergency_crash_reports,
      recent_errors,
      recent_logs
    FROM feedback
  `);

  for (const row of result.rows as Record<string, unknown>[]) {
    const feedbackId = toInteger(row.id);
    if (feedbackId === null) {
      continue;
    }

    const settingsSnapshot = parseJson<Record<string, unknown>>(row.settings_snapshot, {});
    const displayInfo = parseJson<FeedbackDisplayInfo>(row.display_info, DEFAULT_DISPLAY_INFO);
    const processInfo = parseJson<FeedbackProcessInfo>(row.process_info, DEFAULT_PROCESS_INFO);
    const accessibilityInfo = parseJson<FeedbackAccessibilityInfo>(row.accessibility_info, DEFAULT_ACCESSIBILITY_INFO);
    const performanceInfo = parseJson<FeedbackPerformanceInfo>(row.performance_info, DEFAULT_PERFORMANCE_INFO);
    const emergencyCrashReports = parseJson<string[]>(row.emergency_crash_reports, []);
    const recentErrors = parseJson<string[]>(row.recent_errors, []);
    const recentLogs = parseJson<string[]>(row.recent_logs, []);

    const normalizedSettingsSnapshot = normalizeSettingsSnapshot(settingsSnapshot);
    const normalizedDisplayInfo = normalizeDisplayInfo(displayInfo);
    const normalizedProcessInfo = normalizeProcessInfo(processInfo);
    const normalizedAccessibilityInfo = normalizeAccessibilityInfo(accessibilityInfo);
    const normalizedPerformanceInfo = normalizePerformanceInfo(performanceInfo);
    const normalizedCrashReports = normalizeStringArray(emergencyCrashReports);
    const normalizedRecentErrors = normalizeStringArray(recentErrors);
    const normalizedRecentLogs = normalizeStringArray(recentLogs);

    const writeSettings =
      Object.keys(normalizedSettingsSnapshot).length > 0 ||
      hasStructuredPayload(row.settings_snapshot);
    const writeDisplays =
      normalizedDisplayInfo.count > 0 ||
      normalizedDisplayInfo.displays.length > 0;
    const writeProcess = hasProcessData(normalizedProcessInfo);
    const writeAccessibility = hasAccessibilityData(normalizedAccessibilityInfo);
    const writePerformance = hasPerformanceData(normalizedPerformanceInfo);
    const writeCrashReports = normalizedCrashReports.length > 0;
    const writeLogEntries = normalizedRecentErrors.length > 0 || normalizedRecentLogs.length > 0;

    if (
      !writeSettings &&
      !writeDisplays &&
      !writeProcess &&
      !writeAccessibility &&
      !writePerformance &&
      !writeCrashReports &&
      !writeLogEntries
    ) {
      continue;
    }

    await upsertFeedbackDiagnostics(
      database,
      feedbackId,
      {
        settingsSnapshot: normalizedSettingsSnapshot,
        displayInfo: normalizedDisplayInfo,
        processInfo: normalizedProcessInfo,
        accessibilityInfo: normalizedAccessibilityInfo,
        performanceInfo: normalizedPerformanceInfo,
        emergencyCrashReports: normalizedCrashReports,
        recentErrors: normalizedRecentErrors,
        recentLogs: normalizedRecentLogs,
      },
      {
        writeSettings,
        writeDisplays,
        writeProcess,
        writeAccessibility,
        writePerformance,
        writeCrashReports,
        writeLogEntries,
      }
    );
  }
}
