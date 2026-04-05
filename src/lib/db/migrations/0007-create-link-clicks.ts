import type { DatabaseMigration } from "@/lib/db/migration-types";

const migration: DatabaseMigration = {
  version: 7,
  name: "create_link_clicks",
  statements: [
    `
      CREATE TABLE IF NOT EXISTS link_clicks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT NOT NULL,
        destination TEXT NOT NULL,
        referrer TEXT,
        user_agent TEXT,
        ip TEXT,
        country TEXT,
        city TEXT,
        region TEXT,
        request_host TEXT,
        accept_language TEXT,
        query_string TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `,
    `CREATE INDEX IF NOT EXISTS idx_link_clicks_created_at ON link_clicks(created_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_link_clicks_slug ON link_clicks(slug)`,
    `CREATE INDEX IF NOT EXISTS idx_link_clicks_ip ON link_clicks(ip)`,
  ],
};

export default migration;
