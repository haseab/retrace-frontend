import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiBearerAuth } from "@/lib/api-auth";
import { createApiRouteLogger } from "@/lib/api-route-logger";

// Helper to safely add a column
async function addColumn(column: string, definition: string): Promise<string> {
  try {
    await db.execute(`ALTER TABLE feedback ADD COLUMN ${column} ${definition}`);
    return `Added ${column}`;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes("duplicate column") || msg.includes("already exists")) {
      return `${column} already exists`;
    }
    return `Failed to add ${column}: ${msg}`;
  }
}

// Manual migration endpoint - call this once to add missing columns
export async function GET(request: NextRequest) {
  const logger = createApiRouteLogger("migrate.GET", { request });
  logger.start();

  const authError = requireApiBearerAuth(request);
  if (authError) {
    logger.warn("auth_failed", { status: authError.status });
    return authError;
  }

  const results: string[] = [];

  // Add tags column (simple default)
  results.push(await addColumn("tags", "TEXT DEFAULT '[]'"));

  // Add updated_at column (NULL default, we'll update it separately)
  results.push(await addColumn("updated_at", "TEXT"));

  // Add read state column for internal feedback triage
  results.push(await addColumn("is_read", "INTEGER DEFAULT 0"));

  // Update any NULL updated_at values to created_at
  try {
    await db.execute(`UPDATE feedback SET updated_at = created_at WHERE updated_at IS NULL`);
    results.push("Updated NULL updated_at values");
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    results.push(`Failed to update updated_at: ${msg}`);
  }

  try {
    await db.execute(`UPDATE feedback SET is_read = 0 WHERE is_read IS NULL`);
    results.push("Updated NULL is_read values");
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    results.push(`Failed to update is_read: ${msg}`);
  }

  logger.success({
    status: 200,
    results,
  });
  return NextResponse.json({ success: true, results });
}
