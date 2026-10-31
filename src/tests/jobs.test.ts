import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { fixture, jobFixture } from "./fixture.js";
describe("authorized jobs", () => {
  let f: Awaited<ReturnType<typeof fixture>>;
  let jobs: Awaited<ReturnType<typeof jobFixture>>;
  beforeEach(async () => {
    f = await fixture();
    jobs = await jobFixture(f);
  });
  afterEach(async () => {
    await f?.cleanup();
  });
  it("requires login for reads and writes", async () => {
    await request(f.app).get("/jobs").expect(401);
    await request(f.app).post("/jobs").send(jobs.data).expect(401);
  });
  it("lets owners create persistent jobs, but blocks employees", async () => {
    const created = await f.owner.post("/jobs").send(jobs.data).expect(201);
    expect(created.body.status).toBe("scheduled");
    expect(created.body.instructions).toBe("Use the side entrance");
    expect(created.body.scheduled_at).toBe("2026-11-02T19:30:00.000Z");
    const detail = await f.owner.get(`/jobs/${created.body.job_id}`).expect(200);
    expect(detail.body).toEqual(created.body);
    expect(
      await f.db
        .selectFrom("job")
        .selectAll()
        .where("job_id", "=", created.body.job_id)
        .executeTakeFirst(),
    ).toBeDefined();
    await f.employee.post("/jobs").send(jobs.data).expect(403);
  });
  it("lists all jobs for owners and assigned jobs only for employees", async () => {
    expect((await f.owner.get("/jobs").expect(200)).body).toHaveLength(2);
    const mine = await f.employee.get("/jobs").expect(200);
    expect(mine.body.map((j: { job_id: number }) => j.job_id)).toEqual([
      jobs.assigned.job_id,
    ]);
  });
  it("blocks guessed IDs for reads and updates", async () => {
    await f.employee.get(`/jobs/${jobs.other.job_id}`).expect(404);
    await f.employee
      .patch(`/jobs/${jobs.other.job_id}`)
      .send({ status: "completed" })
      .expect(404);
    const stored = await f.db
      .selectFrom("job")
      .select("status")
      .where("job_id", "=", jobs.other.job_id)
      .executeTakeFirstOrThrow();
    expect(stored.status).toBe("requested");
  });
  it("lets employees update progress on an assigned job", async () => {
    await f.employee
      .patch(`/jobs/${jobs.assigned.job_id}`)
      .send({ status: "in_progress" })
      .expect(200);
    const completed = await f.employee
      .patch(`/jobs/${jobs.assigned.job_id}`)
      .send({ status: "completed" })
      .expect(200);
    expect(completed.body.completed_at).toBeTruthy();
  });
  it("rejects mass assignment and unauthorized scheduling", async () => {
    await f.employee
      .patch(`/jobs/${jobs.assigned.job_id}`)
      .send({ status: "completed", customer_id: 999, role: "owner" })
      .expect(400);
    await f.employee
      .patch(`/jobs/${jobs.assigned.job_id}`)
      .send({ status: "scheduled" })
      .expect(403);
    await f.owner
      .patch(`/jobs/${jobs.assigned.job_id}`)
      .send({ status: "invalid" })
      .expect(400);
    await f.owner.get("/jobs/1abc").expect(400);
  });
  it("allows only owners to manage assignments and revokes access immediately", async () => {
    await f.employee
      .put(`/jobs/${jobs.other.job_id}/assignments`)
      .send({ technician_ids: [f.technician.technician_id] })
      .expect(403);
    await f.owner
      .put(`/jobs/${jobs.assigned.job_id}/assignments`)
      .send({ technician_ids: [] })
      .expect(204);
    await f.employee.get(`/jobs/${jobs.assigned.job_id}`).expect(404);
    await f.owner
      .put(`/jobs/${jobs.other.job_id}/assignments`)
      .send({ technician_ids: [f.technician.technician_id] })
      .expect(204);
    await f.employee.get(`/jobs/${jobs.other.job_id}`).expect(200);
  });
  it("rejects invalid assignments without losing existing ones", async () => {
    await f.owner
      .put(`/jobs/${jobs.assigned.job_id}/assignments`)
      .send({ technician_ids: [99999] })
      .expect(400);
    expect(
      (await f.owner.get(`/jobs/${jobs.assigned.job_id}/assignments`)).body,
    ).toHaveLength(1);
  });
  it("rejects malformed create requests and nonexistent references", async () => {
    await f.owner.post("/jobs").send({}).expect(400);
    await f.owner
      .post("/jobs")
      .send({ ...jobs.data, customer_id: 99999 })
      .expect(400);
    await f.owner
      .post("/jobs")
      .send({ ...jobs.data, title: " " })
      .expect(400);
  });
  it("rejects missing fields, invalid dates and invalid instructions without saving", async () => {
    for (const field of ["customer_id", "service_id", "title", "description", "scheduled_at", "service_street", "service_city", "service_state", "service_zip_code"]) {
      const data: Record<string, unknown> = { ...jobs.data };
      delete data[field];
      await f.owner.post("/jobs").send(data).expect(400);
    }
    for (const scheduled_at of ["invalid", "2026-02-30T10:00:00Z", "2026-11-02T25:00:00Z", "2026-11-02T10:00:00"]) {
      await f.owner.post("/jobs").send({ ...jobs.data, scheduled_at }).expect(400);
    }
    await f.owner.post("/jobs").send({ ...jobs.data, instructions: 42 }).expect(400);
    expect((await f.owner.get("/jobs")).body).toHaveLength(2);
  });
  it("lists active services only for owners and rejects inactive service creation", async () => {
    await f.db.updateTable("service").set({ is_active: false }).where("service_id", "=", jobs.data.service_id).execute();
    expect((await f.owner.get("/services").expect(200)).body).toEqual([]);
    await f.employee.get("/services").expect(403);
    await request(f.app).get("/services").expect(401);
    await f.owner.post("/jobs").send(jobs.data).expect(400);
  });
  it("allows optional instructions and controls the initial status", async () => {
    const { instructions: _instructions, ...data } = jobs.data;
    void _instructions;
    const result = await f.owner.post("/jobs").send({ ...data, status: "completed" }).expect(201);
    expect(result.body.instructions).toBe("");
    expect(result.body.status).toBe("scheduled");
  });

});
