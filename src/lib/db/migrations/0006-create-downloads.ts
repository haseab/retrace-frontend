import type { DatabaseMigration } from "@/lib/db/migration-types";

const migration: DatabaseMigration = {
  version: 6,
  name: "create_downloads",
  statements: [
    `
      CREATE TABLE IF NOT EXISTS downloads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        version TEXT,
        source TEXT,
        os TEXT,
        os_version TEXT,
        browser TEXT,
        browser_version TEXT,
        architecture TEXT,
        platform TEXT,
        language TEXT,
        screen_resolution TEXT,
        timezone TEXT,
        referrer TEXT,
        user_agent TEXT,
        ip TEXT,
        country TEXT,
        city TEXT,
        region TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `,
    `CREATE INDEX IF NOT EXISTS idx_downloads_created_at ON downloads(created_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_downloads_os ON downloads(os)`,
    `CREATE INDEX IF NOT EXISTS idx_downloads_source ON downloads(source)`,
  ],
};

export default migration;
