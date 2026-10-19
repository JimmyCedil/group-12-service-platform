import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import type { Database } from "./types.js";

export function createDatabase(
  connectionString = process.env.DATABASE_URL
): Kysely<Database> {
  if (!connectionString) {
    throw new Error("DATABASE_URL is required");
  }

  return new Kysely<Database>({
    dialect: new PostgresDialect({
      pool: new Pool({ connectionString })
    })
  });
}