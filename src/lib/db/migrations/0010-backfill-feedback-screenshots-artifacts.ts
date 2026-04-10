import { listTableColumns } from "@/lib/db/migration-utils";
import type { DatabaseMigration } from "@/lib/db/migration-types";

function isIgnorableDropColumnError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("near \"DROP\"") ||
    message.includes("syntax error") ||
    message.includes("no such column") ||
    message.includes("cannot drop column")
  );
}

const migration: DatabaseMigration = {
  version: 10,
  name: "backfill_feedback_screenshots_artifacts",
  checksumSource: "backfill_feedback_screenshots_artifacts_v1",
  up: async ({ db }) => {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS feedback_screenshots (
        feedback_id INTEGER PRIMARY KEY,
        content_type TEXT NOT NULL DEFAULT 'image/png',
        screenshot_data BLOB NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (feedback_id) REFERENCES feedback(id) ON DELETE CASCADE
      )
    `);

    await db.execute(`
      INSERT INTO feedback_screenshots (feedback_id, content_type, screenshot_data)
      SELECT id, 'image/png', screenshot_data
      FROM feedback
      WHERE screenshot_data IS NOT NULL AND length(screenshot_data) > 0
      ON CONFLICT(feedback_id) DO UPDATE SET
        content_type = excluded.content_type,
        screenshot_data = excluded.screenshot_data,
        updated_at = datetime('now')
    `);

    await db.execute(`
      UPDATE feedback
      SET has_screenshot = CASE
        WHEN EXISTS (
          SELECT 1
          FROM feedback_screenshots
          WHERE feedback_screenshots.feedback_id = feedback.id
        ) THEN 1
        ELSE 0
      END
    `);

    const feedbackColumns = await listTableColumns(db, "feedback");
    if (!feedbackColumns.has("screenshot_data")) {
      return;
    }

    await db.execute(`
      UPDATE feedback
      SET screenshot_data = NULL
      WHERE screenshot_data IS NOT NULL
    `);

    try {
      await db.execute(`ALTER TABLE feedback DROP COLUMN screenshot_data`);
    } catch (error) {
      if (!isIgnorableDropColumnError(error)) {
        throw error;
      }
    }
  },
};

export default migration;
