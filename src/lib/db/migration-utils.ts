import type { Client } from "@libsql/client";

export async function listTableColumns(
  db: Client,
  tableName: string
): Promise<Set<string>> {
  const result = await db.execute(`PRAGMA table_info(${tableName})`);
  const columns = new Set<string>();

  for (const row of result.rows as Record<string, unknown>[]) {
    const columnName = typeof row.name === "string" ? row.name.trim() : "";
    if (columnName.length > 0) {
      columns.add(columnName);
    }
  }

  return columns;
}

export async function addColumnIfMissing(
  db: Client,
  tableName: string,
  columnName: string,
  definition: string
): Promise<void> {
  const columns = await listTableColumns(db, tableName);
  if (columns.has(columnName)) {
    return;
  }

  await db.execute(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
}
