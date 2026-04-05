import type { DatabaseMigration } from "@/lib/db/migration-types";

const migration: DatabaseMigration = {
  version: 5,
  name: "backfill_feedback_and_indexes",
  statements: [
    `
      UPDATE feedback
      SET updated_at = COALESCE(updated_at, created_at, datetime('now'))
      WHERE updated_at IS NULL
    `,
    `
      UPDATE feedback
      SET is_read = 0
      WHERE is_read IS NULL
    `,
    `
      UPDATE feedback
      SET display_count = 0
      WHERE display_count IS NULL
    `,
    `
      DELETE FROM feedback
      WHERE external_source IS NOT NULL
        AND TRIM(external_source) <> ''
        AND external_id IS NOT NULL
        AND TRIM(external_id) <> ''
        AND id NOT IN (
          SELECT MAX(id)
          FROM feedback
          WHERE external_source IS NOT NULL
            AND TRIM(external_source) <> ''
            AND external_id IS NOT NULL
            AND TRIM(external_id) <> ''
          GROUP BY external_source, external_id
        )
    `,
    `CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status)`,
    `CREATE INDEX IF NOT EXISTS idx_feedback_priority ON feedback(priority)`,
    `CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback(type)`,
    `CREATE INDEX IF NOT EXISTS idx_feedback_is_read ON feedback(is_read)`,
    `CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_feedback_updated_at ON feedback(updated_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_feedback_status_updated_at ON feedback(status, updated_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_feedback_type_updated_at ON feedback(type, updated_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_feedback_priority_updated_at ON feedback(priority, updated_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_feedback_diagnostics_timestamp ON feedback(diagnostics_timestamp DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_feedback_display_count ON feedback(display_count)`,
    `CREATE INDEX IF NOT EXISTS idx_feedback_external_source_id ON feedback(external_source, external_id)`,
    `
      CREATE UNIQUE INDEX IF NOT EXISTS idx_feedback_external_source_id_unique
      ON feedback(external_source, external_id)
      WHERE external_source IS NOT NULL
        AND TRIM(external_source) <> ''
        AND external_id IS NOT NULL
        AND TRIM(external_id) <> ''
    `,
  ],
};

export default migration;
