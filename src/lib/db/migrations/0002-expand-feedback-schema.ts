import { addColumnIfMissing } from "@/lib/db/migration-utils";
import type { DatabaseMigration } from "@/lib/db/migration-types";

const migration: DatabaseMigration = {
  version: 2,
  name: "expand_feedback_schema",
  checksumSource: "expand_feedback_schema_v2_column_guards",
  up: async ({ db }) => {
    await addColumnIfMissing(db, "feedback", "status", "TEXT DEFAULT 'open'");
    await addColumnIfMissing(db, "feedback", "priority", "TEXT DEFAULT 'medium'");
    await addColumnIfMissing(db, "feedback", "notes", "TEXT DEFAULT ''");
    await addColumnIfMissing(db, "feedback", "tags", "TEXT DEFAULT '[]'");
    await addColumnIfMissing(db, "feedback", "is_read", "INTEGER DEFAULT 0");
    await addColumnIfMissing(db, "feedback", "diagnostics_timestamp", "TEXT");
    await addColumnIfMissing(db, "feedback", "settings_snapshot", "TEXT");
    await addColumnIfMissing(db, "feedback", "display_info", "TEXT");
    await addColumnIfMissing(db, "feedback", "process_info", "TEXT");
    await addColumnIfMissing(db, "feedback", "accessibility_info", "TEXT");
    await addColumnIfMissing(db, "feedback", "performance_info", "TEXT");
    await addColumnIfMissing(db, "feedback", "emergency_crash_reports", "TEXT");
    await addColumnIfMissing(db, "feedback", "recent_metric_events", "TEXT");
    await addColumnIfMissing(db, "feedback", "display_count", "INTEGER DEFAULT 0");
    await addColumnIfMissing(db, "feedback", "has_screenshot", "INTEGER DEFAULT 0");
    await addColumnIfMissing(db, "feedback", "screenshot_data", "BLOB");
    await addColumnIfMissing(db, "feedback", "external_source", "TEXT");
    await addColumnIfMissing(db, "feedback", "external_id", "TEXT");
    await addColumnIfMissing(db, "feedback", "external_url", "TEXT");
    await addColumnIfMissing(
      db,
      "feedback",
      "included_diagnostic_sections",
      "TEXT"
    );
    await addColumnIfMissing(
      db,
      "feedback",
      "excluded_diagnostic_sections",
      "TEXT"
    );
    await addColumnIfMissing(db, "feedback", "updated_at", "TEXT");
  },
};

export default migration;
