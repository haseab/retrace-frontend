import { createHash } from "node:crypto";
import { db } from "@/lib/db";
import { DATABASE_MIGRATIONS } from "@/lib/db/migrations";
import type { DatabaseMigration } from "@/lib/db/migration-types";

interface AppliedMigrationRecord {
  version: number;
  name: string;
  checksum: string;
  appliedAt: string;
}

interface MigrationRunSummary {
  currentVersion: number;
  appliedVersions: number[];
  pendingVersions: number[];
}

const SCHEMA_MIGRATIONS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    checksum TEXT NOT NULL,
    applied_at TEXT DEFAULT (datetime('now'))
  )
`;

let migrationRunPromise: Promise<MigrationRunSummary> | null = null;

function assertValidMigration(migration: DatabaseMigration) {
  const hasStatements = Array.isArray(migration.statements) && migration.statements.length > 0;
  const hasUp = typeof migration.up === "function";

  if (hasStatements === hasUp) {
    throw new Error(
      `Migration ${migration.version}:${migration.name} must define exactly one of statements or up`
    );
  }
}

function assertUniqueMigrationVersions(migrations: DatabaseMigration[]) {
  const seenVersions = new Set<number>();
  for (const migration of migrations) {
    if (seenVersions.has(migration.version)) {
      throw new Error(`Duplicate migration version detected: ${migration.version}`);
    }

    seenVersions.add(migration.version);
  }
}

function buildMigrationChecksum(migration: DatabaseMigration): string {
  const hash = createHash("sha256");
  hash.update(`${migration.version}:${migration.name}:`);

  if (migration.checksumSource) {
    hash.update(migration.checksumSource);
  } else if (migration.statements) {
    hash.update(JSON.stringify(migration.statements));
  }

  return hash.digest("hex");
}

function isDuplicateColumnError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("duplicate column") ||
    message.includes("already exists") ||
    message.includes("duplicate column name")
  );
}

function isUniqueConstraintError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("UNIQUE constraint failed") ||
    message.includes("PRIMARY KEY constraint failed")
  );
}

async function ensureSchemaMigrationsTable() {
  await db.execute(SCHEMA_MIGRATIONS_TABLE_SQL);
}

async function loadAppliedMigrations(): Promise<Map<number, AppliedMigrationRecord>> {
  const result = await db.execute(`
    SELECT version, name, checksum, applied_at
    FROM schema_migrations
    ORDER BY version ASC
  `);

  const applied = new Map<number, AppliedMigrationRecord>();
  for (const row of result.rows as Record<string, unknown>[]) {
    const version = Number(row.version);
    if (!Number.isFinite(version)) {
      continue;
    }

    applied.set(version, {
      version,
      name: String(row.name ?? ""),
      checksum: String(row.checksum ?? ""),
      appliedAt: String(row.applied_at ?? ""),
    });
  }

  return applied;
}

async function executeMigrationStatements(migration: DatabaseMigration) {
  for (const statement of migration.statements ?? []) {
    const trimmedStatement = statement.trim();
    if (!trimmedStatement) {
      continue;
    }

    try {
      await db.execute(trimmedStatement);
    } catch (error) {
      const isAlterTableStatement = /^ALTER\s+TABLE\s+/i.test(trimmedStatement);
      if (isAlterTableStatement && isDuplicateColumnError(error)) {
        continue;
      }

      throw error;
    }
  }
}

async function recordAppliedMigration(
  migration: DatabaseMigration,
  checksum: string
) {
  try {
    await db.execute({
      sql: `
        INSERT INTO schema_migrations (version, name, checksum, applied_at)
        VALUES (?, ?, ?, datetime('now'))
      `,
      args: [migration.version, migration.name, checksum],
    });
  } catch (error) {
    if (!isUniqueConstraintError(error)) {
      throw error;
    }

    const applied = await loadAppliedMigrations();
    const existing = applied.get(migration.version);
    if (!existing) {
      throw error;
    }

    if (existing.name !== migration.name || existing.checksum !== checksum) {
      throw new Error(
        `Migration ${migration.version} was applied concurrently with mismatched metadata`
      );
    }
  }
}

function getCurrentVersion(applied: Map<number, AppliedMigrationRecord>): number {
  const versions = Array.from(applied.keys());
  return versions.length > 0 ? Math.max(...versions) : 0;
}

async function runDatabaseMigrationsInternal(): Promise<MigrationRunSummary> {
  await ensureSchemaMigrationsTable();

  const migrations = [...DATABASE_MIGRATIONS].sort((left, right) => left.version - right.version);
  assertUniqueMigrationVersions(migrations);
  for (const migration of migrations) {
    assertValidMigration(migration);
  }

  const appliedBefore = await loadAppliedMigrations();
  const appliedVersions: number[] = [];

  for (const migration of migrations) {
    const checksum = buildMigrationChecksum(migration);
    const existing = appliedBefore.get(migration.version);
    if (existing) {
      if (existing.name !== migration.name || existing.checksum !== checksum) {
        throw new Error(
          `Migration ${migration.version} checksum mismatch. Expected ${existing.checksum}, got ${checksum}`
        );
      }
      continue;
    }

    if (migration.up) {
      await migration.up({ db });
    } else {
      await executeMigrationStatements(migration);
    }

    await recordAppliedMigration(migration, checksum);
    appliedVersions.push(migration.version);
  }

  const appliedAfter = await loadAppliedMigrations();
  const pendingVersions = migrations
    .map((migration) => migration.version)
    .filter((version) => !appliedAfter.has(version));

  return {
    currentVersion: getCurrentVersion(appliedAfter),
    appliedVersions,
    pendingVersions,
  };
}

export async function runDatabaseMigrations(): Promise<MigrationRunSummary> {
  if (migrationRunPromise) {
    return migrationRunPromise;
  }

  migrationRunPromise = runDatabaseMigrationsInternal().catch((error) => {
    migrationRunPromise = null;
    throw error;
  });

  return migrationRunPromise;
}

export async function listAppliedDatabaseMigrations(): Promise<
  AppliedMigrationRecord[]
> {
  await ensureSchemaMigrationsTable();
  const applied = await loadAppliedMigrations();
  return Array.from(applied.values()).sort((left, right) => left.version - right.version);
}

export async function getCurrentDatabaseVersion(): Promise<number> {
  const applied = await listAppliedDatabaseMigrations();
  return applied.length > 0 ? applied[applied.length - 1]!.version : 0;
}
