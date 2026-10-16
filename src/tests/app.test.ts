import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../app.js";

describe("GET /health", () => {
  it("returns a successful response and server status", async () => {
    const app = createApp();
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: "ok",
      message: "Service platform API is running"
    });
  });
});

describe("customer API", () => {
  it("creates a customer and includes it in the list", async () => {
    const app = createApp();
    const created = await request(app)
      .post("/customers")
      .send({ name: "Sam Example", email: "sam@example.com" })
      .expect(201);

    expect(created.body).toMatchObject({
      name: "Sam Example",
      email: "sam@example.com"
    });
    expect(created.body.id).toEqual(expect.any(String));

    await request(app)
      .get("/customers")
      .expect(200, [created.body]);
  });

  it("rejects invalid customer input", async () => {
    const app = createApp();

    await request(app)
      .post("/customers")
      .send({ name: "Sam Example", email: "not-an-email" })
      .expect(400, { error: "A name and valid email are required" });
  });
});