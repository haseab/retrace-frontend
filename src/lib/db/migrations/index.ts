import type { DatabaseMigration } from "@/lib/db/migration-types";
import createFeedbackCore from "@/lib/db/migrations/0001-create-feedback-core";
import expandFeedbackSchema from "@/lib/db/migrations/0002-expand-feedback-schema";
import createFeedbackNotes from "@/lib/db/migrations/0003-create-feedback-notes";
import createFeedbackDiagnostics from "@/lib/db/migrations/0004-create-feedback-diagnostics";
import backfillFeedbackAndIndexes from "@/lib/db/migrations/0005-backfill-feedback-and-indexes";
import createDownloads from "@/lib/db/migrations/0006-create-downloads";
import createLinkClicks from "@/lib/db/migrations/0007-create-link-clicks";
import backfillNormalizedFeedbackDiagnostics from "@/lib/db/migrations/0008-backfill-normalized-feedback-diagnostics";

export const DATABASE_MIGRATIONS: DatabaseMigration[] = [
  createFeedbackCore,
  expandFeedbackSchema,
  createFeedbackNotes,
  createFeedbackDiagnostics,
  backfillFeedbackAndIndexes,
  createDownloads,
  createLinkClicks,
  backfillNormalizedFeedbackDiagnostics,
];
