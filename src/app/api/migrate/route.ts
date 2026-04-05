import { NextRequest, NextResponse } from "next/server";
import { requireApiBearerAuth } from "@/lib/api-auth";
import { createApiRouteLogger } from "@/lib/api-route-logger";
import {
  getCurrentDatabaseVersion,
  listAppliedDatabaseMigrations,
  runDatabaseMigrations,
} from "@/lib/db/migration-runner";

export async function GET(request: NextRequest) {
  const logger = createApiRouteLogger("migrate.GET", { request });
  logger.start();

  const authError = requireApiBearerAuth(request);
  if (authError) {
    logger.warn("auth_failed", { status: authError.status });
    return authError;
  }

  try {
    const summary = await runDatabaseMigrations();
    const currentVersion = await getCurrentDatabaseVersion();
    const applied = await listAppliedDatabaseMigrations();

    logger.success({
      status: 200,
      currentVersion,
      appliedCount: applied.length,
      appliedVersions: summary.appliedVersions,
    });

    return NextResponse.json({
      success: true,
      currentVersion,
      appliedVersions: summary.appliedVersions,
      pendingVersions: summary.pendingVersions,
      migrations: applied,
    });
  } catch (error) {
    logger.error("failed", error, { status: 500 });
    return NextResponse.json(
      { error: "Failed to run database migrations" },
      { status: 500 }
    );
  }
}
