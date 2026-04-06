import type { DatabaseMigration } from "@/lib/db/migration-types";

const migration: DatabaseMigration = {
  version: 9,
  name: "create_feedback_artifacts",
  statements: [
    `
      CREATE TABLE IF NOT EXISTS feedback_diagnostics_raw (
        feedback_id INTEGER PRIMARY KEY,
        schema_version INTEGER NOT NULL DEFAULT 1,
        content_encoding TEXT NOT NULL DEFAULT 'gzip',
        payload_data BLOB NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (feedback_id) REFERENCES feedback(id) ON DELETE CASCADE
      )
    `,
    `
      CREATE TABLE IF NOT EXISTS feedback_screenshots (
        feedback_id INTEGER PRIMARY KEY,
        content_type TEXT NOT NULL DEFAULT 'image/png',
        screenshot_data BLOB NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (feedback_id) REFERENCES feedback(id) ON DELETE CASCADE
      )
    `,
    `DROP INDEX IF EXISTS idx_feedback_performance_feedback_id`,
    `DROP INDEX IF EXISTS idx_feedback_process_feedback_id`,
    `DROP INDEX IF EXISTS idx_feedback_accessibility_feedback_id`,
    `DROP INDEX IF EXISTS idx_feedback_displays_feedback_id`,
    `DROP INDEX IF EXISTS idx_feedback_displays_display_index`,
    `DROP INDEX IF EXISTS idx_feedback_settings_feedback_id`,
    `DROP INDEX IF EXISTS idx_feedback_settings_setting_key`,
    `DROP INDEX IF EXISTS idx_feedback_crash_reports_feedback_id`,
    `DROP INDEX IF EXISTS idx_feedback_log_entries_feedback_id`,
    `DROP INDEX IF EXISTS idx_feedback_log_entries_level`,
  ],
};

export default migration;
