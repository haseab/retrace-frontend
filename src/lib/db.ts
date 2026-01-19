import { createClient } from "@libsql/client";

export const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Initialize the feedback table
export async function initDatabase() {
  await db.execute(`
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
      has_screenshot INTEGER DEFAULT 0,
      screenshot_data BLOB,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
}
