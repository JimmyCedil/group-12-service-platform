
import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../app.js";

describe("POST /jobs", () => {
  it("creates a job and returns 201", async () => {
    const response = await request(app).post("/jobs").send({
      customer_ID: 1,
      service_ID: 2,
      title: "Kitchen sink repair",
      description: "Repair a leaking pipe",
    });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      job_ID: expect.any(Number),
      customer_ID: 1,
      service_ID: 2,
      title: "Kitchen sink repair",
      description: "Repair a leaking pipe",
      status: "REQUESTED",
      scheduled_At: null,
      completed_At: null,
    });
    expect(Number.isNaN(Date.parse(response.body.requested_At))).toBe(false);
  });

  it("rejects missing required fields", async () => {
    const response = await request(app).post("/jobs").send({
      customer_ID: 1,
      title: "Missing service ID",
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
  });

  it("rejects invalid IDs", async () => {
    const response = await request(app).post("/jobs").send({
      customer_ID: -1,
      service_ID: 2,
      title: "Kitchen sink repair",
      description: "Repair a leaking pipe",
    });

    expect(response.status).toBe(400);
  });

  it("rejects empty titles", async () => {
    const response = await request(app).post("/jobs").send({
      customer_ID: 1,
      service_ID: 2,
      title: "   ",
      description: "Repair a leaking pipe",
    });

    expect(response.status).toBe(400);
  });
});

describe("GET /jobs", () => {
  it("returns a list containing a created job", async () => {
    const created = await request(app).post("/jobs").send({
      customer_ID: 3,
      service_ID: 4,
      title: "Test listing job",
      description: "Verify that listing works",
    });

    const response = await request(app).get("/jobs");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toContainEqual(created.body);
  });
});
