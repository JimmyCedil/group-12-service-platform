import "dotenv/config";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Migrator, type Kysely, type MigrationProvider } from "kysely";
import { createDatabase } from "./index.js";
import * as initialSchema from "./migrations/001_initial_schema.js";
import type { Database } from "./types.js";

const migrationProvider: MigrationProvider = {
  getMigrations: async () => ({
    "001_initial_schema": initialSchema,
  }),
};

export async function migrateDatabase(db: Kysely<Database>): Promise<void> {
  const migrator = new Migrator({
    db,
    provider: migrationProvider,
  });
  const { error, results } = await migrator.migrateToLatest();

  if (error) {
    throw error;
  }

  for (const result of results ?? []) {
    console.log(`${result.migrationName}: ${result.status}`);
  }
}

export async function migrateToLatest(): Promise<void> {
  const db = createDatabase();

  try {
    await migrateDatabase(db);
  } finally {
    await db.destroy();
  }
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  migrateToLatest().catch((error: unknown) => {
    console.error("Database migration failed:", error);
    process.exitCode = 1;
  });
}
