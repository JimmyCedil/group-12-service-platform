import type { Kysely } from "kysely";
import type { Database } from "../types.js";

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable("customer")
    .addColumn("customer_id", "integer", (column) =>
      column.primaryKey().autoIncrement(),
    )
    .addColumn("first_name", "text", (column) => column.notNull())
    .addColumn("last_name", "text", (column) => column.notNull())
    .addColumn("email", "text", (column) => column.notNull())
    .addColumn("phone", "integer", (column) => column.notNull())
    .addColumn("street", "text", (column) => column.notNull())
    .addColumn("city", "text", (column) => column.notNull())
    .addColumn("state", "text", (column) => column.notNull())
    .addColumn("zip_code", "integer", (column) => column.notNull())
    .execute();

  await db.schema
    .createTable("service")
    .addColumn("service_id", "integer", (column) =>
      column.primaryKey().autoIncrement(),
    )
    .addColumn("name", "text", (column) => column.notNull())
    .addColumn("description", "text", (column) => column.notNull())
    .addColumn("base_price", "real", (column) => column.notNull())
    .addColumn("is_active", "integer", (column) => column.notNull())
    .execute();

  await db.schema
    .createTable("technician")
    .addColumn("technician_id", "integer", (column) =>
      column.primaryKey().autoIncrement(),
    )
    .addColumn("first_name", "text", (column) => column.notNull())
    .addColumn("last_name", "text", (column) => column.notNull())
    .addColumn("email", "text", (column) => column.notNull())
    .addColumn("phone", "integer", (column) => column.notNull())
    .addColumn("is_active", "integer", (column) => column.notNull())
    .execute();

  await db.schema
    .createTable("job")
    .addColumn("job_id", "integer", (column) =>
      column.primaryKey().autoIncrement(),
    )
    .addColumn("customer_id", "integer", (column) =>
      column.notNull().references("customer.customer_id"),
    )
    .addColumn("service_id", "integer", (column) =>
      column.notNull().references("service.service_id"),
    )
    .addColumn("title", "text", (column) => column.notNull())
    .addColumn("description", "text", (column) => column.notNull())
    .addColumn("status", "text", (column) => column.notNull())
    .addColumn("requested_at", "text", (column) => column.notNull())
    .addColumn("scheduled_at", "text")
    .addColumn("completed_at", "text")
    .addColumn("service_street", "text", (column) => column.notNull())
    .addColumn("service_city", "text", (column) => column.notNull())
    .addColumn("service_state", "text", (column) => column.notNull())
    .addColumn("service_zip_code", "integer", (column) => column.notNull())
    .execute();

  await db.schema
    .createTable("job_assignment")
    .addColumn("job_id", "integer", (column) =>
      column.notNull().references("job.job_id").onDelete("cascade"),
    )
    .addColumn("technician_id", "integer", (column) =>
      column.notNull().references("technician.technician_id"),
    )
    .addColumn("assigned_at", "text", (column) => column.notNull())
    .addPrimaryKeyConstraint("job_assignment_pkey", [
      "job_id",
      "technician_id",
    ])
    .execute();

  await db.schema
    .createTable("invoice")
    .addColumn("invoice_id", "integer", (column) =>
      column.primaryKey().autoIncrement(),
    )
    .addColumn("job_id", "integer", (column) =>
      column.notNull().unique().references("job.job_id"),
    )
    .addColumn("issued_date", "text", (column) => column.notNull())
    .addColumn("due_date", "text", (column) => column.notNull())
    .addColumn("total_amount", "real", (column) => column.notNull())
    .addColumn("status", "text", (column) => column.notNull())
    .execute();

  await db.schema
    .createTable("payment")
    .addColumn("payment_id", "integer", (column) =>
      column.primaryKey().autoIncrement(),
    )
    .addColumn("invoice_id", "integer", (column) =>
      column.notNull().references("invoice.invoice_id"),
    )
    .addColumn("amount", "real", (column) => column.notNull())
    .addColumn("paid_at", "text", (column) => column.notNull())
    .addColumn("payment_method", "text", (column) => column.notNull())
    .addColumn("reference_number", "integer", (column) => column.notNull())
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.dropTable("payment").ifExists().execute();
  await db.schema.dropTable("invoice").ifExists().execute();
  await db.schema.dropTable("job_assignment").ifExists().execute();
  await db.schema.dropTable("job").ifExists().execute();
  await db.schema.dropTable("technician").ifExists().execute();
  await db.schema.dropTable("service").ifExists().execute();
  await db.schema.dropTable("customer").ifExists().execute();
}
