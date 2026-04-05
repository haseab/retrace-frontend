import type { Client } from "@libsql/client";

export interface DatabaseMigrationContext {
  db: Client;
}

export interface DatabaseMigration {
  version: number;
  name: string;
  statements?: string[];
  checksumSource?: string;
  up?: (context: DatabaseMigrationContext) => Promise<void>;
}
