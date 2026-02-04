import { NextResponse } from "next/server";
import { db } from "@/lib/db";

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
export async function GET() {
  const results: string[] = [];

  // Add tags column (simple default)
  results.push(await addColumn("tags", "TEXT DEFAULT '[]'"));

  // Add updated_at column (NULL default, we'll update it separately)
  results.push(await addColumn("updated_at", "TEXT"));

  // Update any NULL updated_at values to created_at
  try {
    await db.execute(`UPDATE feedback SET updated_at = created_at WHERE updated_at IS NULL`);
    results.push("Updated NULL updated_at values");
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    results.push(`Failed to update updated_at: ${msg}`);
  }

  return NextResponse.json({ success: true, results });
}
