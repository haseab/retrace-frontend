import type { DatabaseMigration } from "@/lib/db/migration-types";

const migration: DatabaseMigration = {
  version: 3,
  name: "create_feedback_notes",
  statements: [
    `
      CREATE TABLE IF NOT EXISTS feedback_notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        feedback_id INTEGER NOT NULL,
        author TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (feedback_id) REFERENCES feedback(id) ON DELETE CASCADE
      )
    `,
    `CREATE INDEX IF NOT EXISTS idx_feedback_notes_feedback_id ON feedback_notes(feedback_id)`,
  ],
};

export default migration;
