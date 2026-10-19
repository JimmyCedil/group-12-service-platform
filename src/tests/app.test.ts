import { randomUUID } from "node:crypto";
import request from "supertest";
import { sql, type Kysely } from "kysely";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { createDatabase } from "../db/index.js";
import { migrateDatabase } from "../db/migrate.js";
import type { Database } from "../db/types.js";

describe("service platform app", () => {
  let admin: Kysely<Database> | undefined;
  let db: Kysely<Database> | undefined;
  let schema: string;
  let app: ReturnType<typeof createApp>;

  beforeEach(async () => {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error("DATABASE_URL is required for PostgreSQL tests");
    }

    schema = `test_${randomUUID().replaceAll("-", "")}`;
    admin = createDatabase(connectionString);

    await sql`create schema ${sql.id(schema)}`.execute(admin);

    const testUrl = new URL(connectionString);
    testUrl.searchParams.set("options", `-c search_path=${schema}`);

    db = createDatabase(testUrl.toString());
    await migrateDatabase(db, schema);
    app = createApp(db);
  });

  afterEach(async () => {
    try {
      await db?.destroy();
    } finally {
      if (admin) {
        try {
          await sql`drop schema if exists ${sql.id(schema)} cascade`
            .execute(admin);
        } finally {
          await admin.destroy();
        }
      }

      db = undefined;
      admin = undefined;
    }
  });

  it("returns a successful health response", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: "ok",
      message: "Service platform API is running",
    });
  });

  it("creates a customer and reads it back", async () => {
    const customer = {
      first_name: "Taylor",
      last_name: "Morgan",
      email: "taylor@example.com",
      phone: "05551234567",
      street: "12 Main Street",
      city: "Springfield",
      state: "MA",
      zip_code: "02108",
    };

    const created = await request(app)
      .post("/customers")
      .send(customer);

    expect(created.status).toBe(201);
    expect(created.body).toMatchObject(customer);
    expect(created.body.customer_id).toEqual(expect.any(Number));

    const listed = await request(app).get("/customers");

    expect(listed.status).toBe(200);
    expect(listed.body).toEqual([created.body]);
  });

  it("rejects incomplete customer data without saving it", async () => {
    const response = await request(app)
      .post("/customers")
      .send({ first_name: "Taylor" });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");

    await request(app).get("/customers").expect(200, []);
  });

  it("creates all nine app tables", async () => {
    const tables = await sql<{ table_name: string }>`
      select table_name
      from information_schema.tables
      where table_schema = ${schema}
        and table_type = 'BASE TABLE'
    `.execute(db!);

    expect(tables.rows.map((row) => row.table_name)).toEqual(
      expect.arrayContaining([
        "user",
        "customer",
        "service",
        "technician",
        "job",
        "job_assignment",
        "invoice",
        "payment",
        "job_photo",
      ]),
    );
  });

  it("rejects a job referencing nonexistent records", async () => {
    await expect(
      db!
        .insertInto("job")
        .values({
          customer_id: 999,
          service_id: 999,
          title: "Unlinked job",
          description: "References nonexistent customer and service",
          status: "requested",
          service_street: "12 Main Street",
          service_city: "Springfield",
          service_state: "IL",
          service_zip_code: "62701",
        })
        .execute(),
    ).rejects.toMatchObject({
      code: "23503",
    });
  });
});