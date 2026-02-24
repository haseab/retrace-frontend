import { createClient } from "@libsql/client";
import {
  backfillLegacyDiagnostics,
  ensureFeedbackDiagnosticsTables,
  hasLegacyDiagnosticsSourceData,
} from "@/lib/feedback-diagnostics";

export const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const NORMALIZED_DIAGNOSTICS_BACKFILL_KEY = "normalized_feedback_diagnostics_backfill_v1";

// Helper to safely add a column if it doesn't exist
async function addColumnIfNotExists(table: string, column: string, definition: string) {
  try {
    // Try to add the column directly - if it already exists, it will fail gracefully
    await db.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    console.log(`Added column ${column} to ${table}`);
  } catch (error) {
    // Column likely already exists - this is expected
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes("duplicate column") || errorMessage.includes("already exists")) {
      // Column exists, this is fine
    } else {
      console.log(`Migration note for ${table}.${column}:`, errorMessage);
    }
  }
}

async function markMigrationComplete(key: string) {
  try {
    await db.execute({
      sql: `
        INSERT INTO migration_state (migration_key, migration_value, updated_at)
        VALUES (?, ?, datetime('now'))
        ON CONFLICT(migration_key) DO UPDATE SET
          migration_value = excluded.migration_value,
          updated_at = datetime('now')
      `,
      args: [key, new Date().toISOString()],
    });
  } catch (error) {
    console.log(`Migration marker warning for ${key}:`, error);
  }
}

async function runNormalizedDiagnosticsBackfillIfNeeded() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS migration_state (
      migration_key TEXT PRIMARY KEY,
      migration_value TEXT,
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  const existing = await db.execute({
    sql: "SELECT migration_key FROM migration_state WHERE migration_key = ?",
    args: [NORMALIZED_DIAGNOSTICS_BACKFILL_KEY],
  });

  if (existing.rows.length > 0) {
    return;
  }

  const hasLegacyDiagnostics = await hasLegacyDiagnosticsSourceData(db);
  if (hasLegacyDiagnostics) {
    await backfillLegacyDiagnostics(db);
  }
  await markMigrationComplete(NORMALIZED_DIAGNOSTICS_BACKFILL_KEY);
}

// Run migrations for existing tables
async function runMigrations() {
  // Add new columns to feedback table if they don't exist
  // Note: SQLite doesn't allow non-constant defaults when adding columns
  await addColumnIfNotExists("feedback", "status", "TEXT DEFAULT 'open'");
  await addColumnIfNotExists("feedback", "priority", "TEXT DEFAULT 'medium'");
  await addColumnIfNotExists("feedback", "notes", "TEXT DEFAULT ''");
  await addColumnIfNotExists("feedback", "updated_at", "TEXT"); // No default - will be NULL initially
  await addColumnIfNotExists("feedback", "tags", "TEXT DEFAULT '[]'");
  await addColumnIfNotExists("feedback", "is_read", "INTEGER DEFAULT 0");
  await addColumnIfNotExists("feedback", "diagnostics_timestamp", "TEXT");
  await addColumnIfNotExists("feedback", "settings_snapshot", "TEXT");
  await addColumnIfNotExists("feedback", "display_info", "TEXT");
  await addColumnIfNotExists("feedback", "process_info", "TEXT");
  await addColumnIfNotExists("feedback", "accessibility_info", "TEXT");
  await addColumnIfNotExists("feedback", "performance_info", "TEXT");
  await addColumnIfNotExists("feedback", "emergency_crash_reports", "TEXT");
  await addColumnIfNotExists("feedback", "display_count", "INTEGER DEFAULT 0");

  await ensureFeedbackDiagnosticsTables(db);

  // Backfill NULL updated_at with created_at
  try {
    await db.execute(`UPDATE feedback SET updated_at = created_at WHERE updated_at IS NULL`);
  } catch {
    // Ignore errors here
  }

  try {
    await db.execute(`UPDATE feedback SET is_read = 0 WHERE is_read IS NULL`);
  } catch {
    // Ignore errors here
  }

  try {
    await db.execute(`UPDATE feedback SET display_count = 0 WHERE display_count IS NULL`);
  } catch {
    // Ignore errors here
  }

  await runNormalizedDiagnosticsBackfillIfNeeded();
}

// Initialize the database tables
export async function initDatabase() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      email TEXT,
      description TEXT NOT NULL,
      status TEXT DEFAULT 'open',
      priority TEXT DEFAULT 'medium',
      notes TEXT DEFAULT '',
      tags TEXT DEFAULT '[]',
      is_read INTEGER DEFAULT 0,
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
      diagnostics_timestamp TEXT,
      settings_snapshot TEXT,
      display_info TEXT,
      process_info TEXT,
      accessibility_info TEXT,
      performance_info TEXT,
      emergency_crash_reports TEXT,
      display_count INTEGER DEFAULT 0,
      has_screenshot INTEGER DEFAULT 0,
      screenshot_data BLOB,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Run migrations for existing tables (add columns if they don't exist)
  await runMigrations();

  // Add indexes for performance (only after migrations ensure columns exist)
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_feedback_priority ON feedback(priority)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_feedback_is_read ON feedback(is_read)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_feedback_updated_at ON feedback(updated_at DESC)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_feedback_diagnostics_timestamp ON feedback(diagnostics_timestamp DESC)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_feedback_display_count ON feedback(display_count)`);

  // Create feedback_notes table for comments
  await db.execute(`
    CREATE TABLE IF NOT EXISTS feedback_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      feedback_id INTEGER NOT NULL,
      author TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (feedback_id) REFERENCES feedback(id) ON DELETE CASCADE
    )
  `);

  await db.execute(`CREATE INDEX IF NOT EXISTS idx_feedback_notes_feedback_id ON feedback_notes(feedback_id)`);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS downloads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      version TEXT,
      source TEXT,
      os TEXT,
      os_version TEXT,
      browser TEXT,
      browser_version TEXT,
      architecture TEXT,
      platform TEXT,
      language TEXT,
      screen_resolution TEXT,
      timezone TEXT,
      referrer TEXT,
      user_agent TEXT,
      ip TEXT,
      country TEXT,
      city TEXT,
      region TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
}
