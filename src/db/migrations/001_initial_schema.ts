import { sql, type Kysely } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable("user")
    .addColumn("user_id", "serial", (column) => column.primaryKey())
    .addColumn("email", "text", (column) => column.notNull().unique())
    .addColumn("password_hash", "text", (column) => column.notNull())
    .addColumn("role", "text", (column) => column.notNull())
    .addColumn("created_at", "timestamptz", (column) =>
      column.notNull().defaultTo(sql`now()`),
    )
    .addCheckConstraint(
      "user_role_check",
      sql`role in ('owner', 'technician')`,
    )
    .execute();

  await db.schema
    .createTable("customer")
    .addColumn("customer_id", "serial", (column) => column.primaryKey())
    .addColumn("first_name", "text", (column) => column.notNull())
    .addColumn("last_name", "text", (column) => column.notNull())
    .addColumn("email", "text", (column) => column.notNull())
    .addColumn("phone", "text", (column) => column.notNull())
    .addColumn("street", "text", (column) => column.notNull())
    .addColumn("city", "text", (column) => column.notNull())
    .addColumn("state", "text", (column) => column.notNull())
    .addColumn("zip_code", "text", (column) => column.notNull())
    .execute();

  await db.schema
    .createTable("service")
    .addColumn("service_id", "serial", (column) => column.primaryKey())
    .addColumn("name", "text", (column) => column.notNull())
    .addColumn("description", "text", (column) => column.notNull())
    .addColumn("base_price", "numeric(12, 2)", (column) => column.notNull())
    .addColumn("is_active", "boolean", (column) =>
      column.notNull().defaultTo(true),
    )
    .addCheckConstraint("service_price_check", sql`base_price >= 0`)
    .execute();

  await db.schema
    .createTable("technician")
    .addColumn("technician_id", "serial", (column) => column.primaryKey())
    .addColumn("user_id", "integer", (column) =>
      column.notNull().unique().references("user.user_id"),
    )
    .addColumn("first_name", "text", (column) => column.notNull())
    .addColumn("last_name", "text", (column) => column.notNull())
    .addColumn("phone", "text", (column) => column.notNull())
    .addColumn("is_active", "boolean", (column) =>
      column.notNull().defaultTo(true),
    )
    .execute();

  await db.schema
    .createTable("job")
    .addColumn("job_id", "serial", (column) => column.primaryKey())
    .addColumn("customer_id", "integer", (column) =>
      column.notNull().references("customer.customer_id"),
    )
    .addColumn("service_id", "integer", (column) =>
      column.notNull().references("service.service_id"),
    )
    .addColumn("title", "text", (column) => column.notNull())
    .addColumn("description", "text", (column) => column.notNull())
    .addColumn("status", "text", (column) =>
      column.notNull().defaultTo("requested"),
    )
    .addColumn("requested_at", "timestamptz", (column) =>
      column.notNull().defaultTo(sql`now()`),
    )
    .addColumn("scheduled_at", "timestamptz")
    .addColumn("completed_at", "timestamptz")
    .addColumn("service_street", "text", (column) => column.notNull())
    .addColumn("service_city", "text", (column) => column.notNull())
    .addColumn("service_state", "text", (column) => column.notNull())
    .addColumn("service_zip_code", "text", (column) => column.notNull())
    .addCheckConstraint(
      "job_status_check",
      sql`status in ('requested', 'scheduled', 'in_progress', 'completed')`,
    )
    .execute();

  await db.schema
    .createTable("job_assignment")
    .addColumn("job_id", "integer", (column) =>
      column.notNull().references("job.job_id").onDelete("cascade"),
    )
    .addColumn("technician_id", "integer", (column) =>
      column.notNull().references("technician.technician_id"),
    )
    .addColumn("assigned_at", "timestamptz", (column) =>
      column.notNull().defaultTo(sql`now()`),
    )
    .addPrimaryKeyConstraint("job_assignment_pkey", [
      "job_id",
      "technician_id",
    ])
    .execute();

  await db.schema
    .createTable("invoice")
    .addColumn("invoice_id", "serial", (column) => column.primaryKey())
    .addColumn("job_id", "integer", (column) =>
      column.notNull().unique().references("job.job_id"),
    )
    .addColumn("issued_date", "timestamptz", (column) => column.notNull())
    .addColumn("due_date", "timestamptz", (column) => column.notNull())
    .addColumn("total_amount", "numeric(12, 2)", (column) => column.notNull())
    .addColumn("status", "text", (column) => column.notNull())
    .addCheckConstraint("invoice_amount_check", sql`total_amount >= 0`)
    .execute();

  await db.schema
    .createTable("payment")
    .addColumn("payment_id", "serial", (column) => column.primaryKey())
    .addColumn("invoice_id", "integer", (column) =>
      column.notNull().references("invoice.invoice_id"),
    )
    .addColumn("amount", "numeric(12, 2)", (column) => column.notNull())
    .addColumn("paid_at", "timestamptz", (column) => column.notNull())
    .addColumn("payment_method", "text", (column) => column.notNull())
    .addColumn("reference_number", "text", (column) => column.notNull())
    .addCheckConstraint("payment_amount_check", sql`amount > 0`)
    .execute();

  await db.schema
    .createTable("job_photo")
    .addColumn("photo_id", "serial", (column) => column.primaryKey())
    .addColumn("job_id", "integer", (column) =>
      column.notNull().references("job.job_id").onDelete("cascade"),
    )
    .addColumn("uploaded_by", "integer", (column) =>
      column.notNull().references("user.user_id"),
    )
    .addColumn("object_key", "text", (column) => column.notNull())
    .addColumn("original_filename", "text", (column) => column.notNull())
    .addColumn("content_type", "text", (column) => column.notNull())
    .addColumn("uploaded_at", "timestamptz", (column) =>
      column.notNull().defaultTo(sql`now()`),
    )
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable("job_photo").ifExists().execute();
  await db.schema.dropTable("payment").ifExists().execute();
  await db.schema.dropTable("invoice").ifExists().execute();
  await db.schema.dropTable("job_assignment").ifExists().execute();
  await db.schema.dropTable("job").ifExists().execute();
  await db.schema.dropTable("technician").ifExists().execute();
  await db.schema.dropTable("service").ifExists().execute();
  await db.schema.dropTable("customer").ifExists().execute();
  await db.schema.dropTable("user").ifExists().execute();
}