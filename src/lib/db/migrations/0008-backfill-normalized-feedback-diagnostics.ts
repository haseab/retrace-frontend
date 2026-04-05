import {
  backfillLegacyDiagnostics,
  hasLegacyDiagnosticsSourceData,
} from "@/lib/feedback-diagnostics";
import type { DatabaseMigration } from "@/lib/db/migration-types";

const migration: DatabaseMigration = {
  version: 8,
  name: "backfill_normalized_feedback_diagnostics",
  checksumSource: "backfillLegacyDiagnostics_v2_select_recent_metric_events",
  up: async ({ db }) => {
    const hasLegacyDiagnostics = await hasLegacyDiagnosticsSourceData(db);
    if (!hasLegacyDiagnostics) {
      return;
    }

    await backfillLegacyDiagnostics(db);
  },
};

export default migration;
