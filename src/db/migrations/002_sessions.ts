import type { Kysely } from "kysely";
export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable("session")
    .addColumn("token_hash", "text", (c) => c.primaryKey())
    .addColumn("user_id", "integer", (c) =>
      c.notNull().references("user.user_id").onDelete("cascade"),
    )
    .addColumn("expires_at", "timestamptz", (c) => c.notNull())
    .execute();
  await db.schema
    .createIndex("session_expires_at_idx")
    .on("session")
    .column("expires_at")
    .execute();
  await db.schema
    .createIndex("job_assignment_technician_idx")
    .on("job_assignment")
    .column("technician_id")
    .execute();
}
export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropIndex("job_assignment_technician_idx").execute();
  await db.schema.dropTable("session").execute();
}
