import express from "express"

export const app = express ();

app.use(express.json());

app.get("/health", (_req, res) => {
    res.status(200).json({
      status: "ok",
      message: "Service platform API is running"
    });
  });
import request from "supertest";
import type { Kysely } from "kysely";
import { sql } from "kysely";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { createDatabase } from "../db/index.js";
import { migrateDatabase } from "../db/migrate.js";
import type { Database } from "../db/types.js";

describe("service platform app", () => {
  let db: Kysely<Database>;
  let app: ReturnType<typeof createApp>;

  beforeEach(async () => {
    db = createDatabase(":memory:");
    await migrateDatabase(db);
    app = createApp(db);
  });

  afterEach(async () => {
    await db.destroy();
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
      phone: 5551234567,
      street: "12 Main Street",
      city: "Springfield",
      state: "IL",
      zip_code: 62701,
    };

    const created = await request(app).post("/customers").send(customer);
    const listed = await request(app).get("/customers");

    expect(created.status).toBe(201);
    expect(created.body).toMatchObject(customer);
    expect(created.body.customer_id).toBe(1);
    expect(listed.status).toBe(200);
    expect(listed.body).toEqual([created.body]);
  });

  it("rejects customer data that does not match the schema", async () => {
    const response = await request(app)
      .post("/customers")
      .send({ first_name: "Taylor" });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
  });

  it("creates each ERD table and enforces its relationships", async () => {
    const tables = await sql<{ name: string }>`
      select name
      from sqlite_master
      where type = 'table'
    `.execute(db);
    const foreignKeys = await sql<{ table: string; from: string }>`
      pragma foreign_key_list('job')
    `.execute(db);
    const assignmentForeignKeys = await sql<{
      table: string;
      from: string;
    }>`pragma foreign_key_list('job_assignment')`.execute(db);
    const invoiceForeignKeys = await sql<{ table: string; from: string }>`
      pragma foreign_key_list('invoice')
    `.execute(db);
    const paymentForeignKeys = await sql<{ table: string; from: string }>`
      pragma foreign_key_list('payment')
    `.execute(db);

    expect(tables.rows.map(({ name }) => name)).toEqual(
      expect.arrayContaining([
        "customer",
        "job",
        "service",
        "invoice",
        "technician",
        "job_assignment",
        "payment",
      ]),
    );
    expect(foreignKeys.rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ table: "customer", from: "customer_id" }),
        expect.objectContaining({ table: "service", from: "service_id" }),
      ]),
    );
    expect(assignmentForeignKeys.rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ table: "job", from: "job_id" }),
        expect.objectContaining({
          table: "technician",
          from: "technician_id",
        }),
      ]),
    );
    expect(invoiceForeignKeys.rows).toEqual([
      expect.objectContaining({ table: "job", from: "job_id" }),
    ]);
    expect(paymentForeignKeys.rows).toEqual([
      expect.objectContaining({ table: "invoice", from: "invoice_id" }),
    ]);

    await expect(
      db
        .insertInto("job")
        .values({
          customer_id: 999,
          service_id: 999,
          title: "Unlinked job",
          description: "Should violate both foreign keys",
          status: "requested",
          requested_at: "2026-10-18T00:00:00.000Z",
          scheduled_at: null,
          completed_at: null,
          service_street: "12 Main Street",
          service_city: "Springfield",
          service_state: "IL",
          service_zip_code: 62701,
        })
        .execute(),
    ).rejects.toThrow(/FOREIGN KEY/);
  });
});
