import type { DatabaseMigration } from "@/lib/db/migration-types";

const migration: DatabaseMigration = {
  version: 1,
  name: "create_feedback_core",
  statements: [
    `
      CREATE TABLE IF NOT EXISTS feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        email TEXT,
        description TEXT NOT NULL,
        app_version TEXT,
        build_number TEXT,
        macos_version TEXT,
        device_model TEXT,
        total_disk_space TEXT,
        free_disk_space TEXT,
        session_count INTEGER,
        frame_count INTEGER,
        segment_count INTEGER,
        database_size_mb REAL,
        recent_errors TEXT,
        recent_logs TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `,
  ],
};

export default migration;
