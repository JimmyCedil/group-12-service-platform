
import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../app.js";

describe("POST /customers", () => {
  it("creates a customer and returns 201", async () => {
    const response = await request(app).post("/customers").send({
      first_Name: "Jane",
      last_Name: "Smith",
      email: "jane.smith@example.com",
      phone: "336-555-0123",
      street: "123 Main Street",
      city: "Winston-Salem",
      state: "NC",
      zip_Code: 27101,
    });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      customer_ID: expect.any(Number),
      first_Name: "Jane",
      last_Name: "Smith",
      email: "jane.smith@example.com",
      phone: "336-555-0123",
      street: "123 Main Street",
      city: "Winston-Salem",
      state: "NC",
      zip_Code: 27101,
    });
  });

  it("rejects missing required fields", async () => {
    const response = await request(app).post("/customers").send({
      first_Name: "Jane",
      email: "jane@example.com",
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
  });

  it("rejects an invalid email address", async () => {
    const response = await request(app).post("/customers").send({
      first_Name: "Jane",
      last_Name: "Smith",
      email: "not-an-email",
      phone: "336-555-0123",
    });

    expect(response.status).toBe(400);
  });

  it("rejects an empty first name", async () => {
    const response = await request(app).post("/customers").send({
      first_Name: " ",
      last_Name: "Smith",
      email: "jane@example.com",
      phone: "336-555-0123",
    });

    expect(response.status).toBe(400);
  });

  it("allows omitted address fields", async () => {
    const response = await request(app).post("/customers").send({
      first_Name: "John",
      last_Name: "Doe",
      email: "john.doe@example.com",
      phone: "3365550123",
    });

    expect(response.status).toBe(201);
    expect(response.body.street).toBeNull();
    expect(response.body.city).toBeNull();
    expect(response.body.state).toBeNull();
    expect(response.body.zip_Code).toBeNull();
  });
});

describe("GET /customers", () => {
  it("returns a list containing a created customer", async () => {
    const created = await request(app).post("/customers").send({
      first_Name: "Test",
      last_Name: "Customer",
      email: "test.customer@example.com",
      phone: "336-555-0199",
    });

    const response = await request(app).get("/customers");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toContainEqual(created.body);
  });
});
