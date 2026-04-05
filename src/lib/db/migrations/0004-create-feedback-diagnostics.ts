import { ensureFeedbackDiagnosticsTables } from "@/lib/feedback-diagnostics";
import type { DatabaseMigration } from "@/lib/db/migration-types";

const migration: DatabaseMigration = {
  version: 4,
  name: "create_feedback_diagnostics",
  checksumSource: "ensureFeedbackDiagnosticsTables_v1",
  up: async ({ db }) => {
    await ensureFeedbackDiagnosticsTables(db);
  },
};

export default migration;
