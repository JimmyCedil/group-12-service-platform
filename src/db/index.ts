import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import BetterSqlite3 from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";
import type { Database as DatabaseSchema } from "./types.js";

export function createDatabase(
  databasePath = process.env.DATABASE_PATH ?? "./data/service-platform.db",
): Kysely<DatabaseSchema> {
  const resolvedPath =
    databasePath === ":memory:" ? databasePath : resolve(databasePath);

  if (resolvedPath !== ":memory:") {
    mkdirSync(dirname(resolvedPath), { recursive: true });
  }

  const sqlite = new BetterSqlite3(resolvedPath);
  sqlite.pragma("foreign_keys = ON");

  return new Kysely<DatabaseSchema>({
    dialect: new SqliteDialect({ database: sqlite }),
  });
}