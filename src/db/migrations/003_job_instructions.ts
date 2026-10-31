import type { Kysely } from "kysely";
export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema.alterTable("job").addColumn("instructions", "text", c => c.notNull().defaultTo("")).execute();
}
export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.alterTable("job").dropColumn("instructions").execute();
}
