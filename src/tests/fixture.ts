import { randomUUID } from "node:crypto";
import { sql } from "kysely";
import request from "supertest";
import { createDatabase } from "../db/index.js";
import { migrateDatabase } from "../db/migrate.js";
import { createApp } from "../app.js";
import { hashPassword } from "../auth/passwords.js";
export const testPassword = "Testing-only-password-42!";
export async function fixture() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required for PostgreSQL tests");
  const schema = `test_${randomUUID().replaceAll("-", "")}`;
  const admin = createDatabase(url);
  await sql`create schema ${sql.id(schema)}`.execute(admin);
  const testUrl = new URL(url);
  testUrl.searchParams.set("options", `-c search_path=${schema}`);
  const db = createDatabase(testUrl.toString()).withSchema(schema);
  await migrateDatabase(db, schema);
  const password_hash = await hashPassword(testPassword);
  const ownerUser = await db
    .insertInto("user")
    .values({ email: "owner@test.example", password_hash, role: "owner" })
    .returningAll()
    .executeTakeFirstOrThrow();
  const employeeUser = await db
    .insertInto("user")
    .values({
      email: "employee@test.example",
      password_hash,
      role: "technician",
    })
    .returningAll()
    .executeTakeFirstOrThrow();
  const technician = await db
    .insertInto("technician")
    .values({
      user_id: employeeUser.user_id,
      first_name: "Test",
      last_name: "Employee",
      phone: "123",
    })
    .returningAll()
    .executeTakeFirstOrThrow();
  const app = createApp(db);
  const owner = request.agent(app);
  const employee = request.agent(app);
  await owner
    .post("/auth/login")
    .send({ email: ownerUser.email, password: testPassword })
    .expect(200);
  await employee
    .post("/auth/login")
    .send({ email: employeeUser.email, password: testPassword })
    .expect(200);
  return {
    db,
    app,
    owner,
    employee,
    ownerUser,
    employeeUser,
    technician,
    async cleanup() {
      await db.destroy();
      await sql`drop schema if exists ${sql.id(schema)} cascade`.execute(admin);
      await admin.destroy();
    },
  };
}
export const customerData = {
  first_name: "Taylor",
  last_name: "Morgan",
  email: "taylor@example.com",
  phone: "05551234567",
  street: "12 Main Street",
  city: "Charlotte",
  state: "NC",
  zip_code: "02108",
};
export async function jobFixture(f: Awaited<ReturnType<typeof fixture>>) {
  const customer = await f.db
    .insertInto("customer")
    .values(customerData)
    .returningAll()
    .executeTakeFirstOrThrow();
  const service = await f.db
    .insertInto("service")
    .values({
      name: "Cleaning",
      description: "Home cleaning",
      base_price: "120.00",
    })
    .returningAll()
    .executeTakeFirstOrThrow();
  const data = {
    customer_id: customer.customer_id,
    service_id: service.service_id,
    title: "Kitchen cleaning",
    description: "Deep clean",
    service_street: customer.street,
    service_city: customer.city,
    service_state: customer.state,
    service_zip_code: customer.zip_code,
  };
  const assigned = await f.db
    .insertInto("job")
    .values({ ...data, status: "scheduled" })
    .returningAll()
    .executeTakeFirstOrThrow();
  const other = await f.db
    .insertInto("job")
    .values({ ...data, title: "Other job" })
    .returningAll()
    .executeTakeFirstOrThrow();
  await f.db
    .insertInto("job_assignment")
    .values({
      job_id: assigned.job_id,
      technician_id: f.technician.technician_id,
    })
    .execute();
  const otherUser = await f.db
    .insertInto("user")
    .values({
      email: "other@test.example",
      role: "technician",
      password_hash: f.employeeUser.password_hash,
    })
    .returningAll()
    .executeTakeFirstOrThrow();
  const otherTechnician = await f.db
    .insertInto("technician")
    .values({
      user_id: otherUser.user_id,
      first_name: "Other",
      last_name: "Employee",
      phone: "456",
    })
    .returningAll()
    .executeTakeFirstOrThrow();
  await f.db
    .insertInto("job_assignment")
    .values({
      job_id: other.job_id,
      technician_id: otherTechnician.technician_id,
    })
    .execute();
  return { assigned, other, data };
}
