import { createHash } from "node:crypto";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { hashPassword, verifyPassword } from "../auth/passwords.js";
import { fixture, testPassword } from "./fixture.js";
describe("sessions and authentication", () => {
  let f: Awaited<ReturnType<typeof fixture>>;
  beforeEach(async () => {
    f = await fixture();
  });
  afterEach(async () => {
    await f?.cleanup();
  });
  it("uses salted hashes and verifies passwords", async () => {
    const hash = await hashPassword(testPassword);
    expect(hash).not.toBe(await hashPassword(testPassword));
    expect(await verifyPassword(testPassword, hash)).toBe(true);
    expect(await verifyPassword("incorrect", hash)).toBe(false);
    expect(await verifyPassword(testPassword, "broken")).toBe(false);
  });
  it("logs in with a restricted cookie and never exposes password hashes", async () => {
    const response = await request(f.app)
      .post("/auth/login")
      .send({
        email: " OWNER@test.example ",
        password: testPassword,
        role: "technician",
      })
      .expect(200);
    expect(response.body.user).toEqual({
      user_id: f.ownerUser.user_id,
      email: f.ownerUser.email,
      role: "owner",
    });
    const cookie = response.headers["set-cookie"][0];
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Strict");
    const token = cookie.match(/crewlink_session=([^;]+)/)![1];
    const sessions = await f.db.selectFrom("session").selectAll().execute();
    expect(sessions.some((s) => s.token_hash === token)).toBe(false);
    expect(
      sessions.some(
        (s) =>
          s.token_hash === createHash("sha256").update(token).digest("hex"),
      ),
    ).toBe(true);
    await request(createApp(f.db))
      .get("/auth/me")
      .set("Cookie", cookie)
      .expect(200);
  });
  it("sets Secure session cookies in production", async () => {
    const previous = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    try {
      const response = await request(f.app)
        .post("/auth/login")
        .send({ email: f.ownerUser.email, password: testPassword })
        .expect(200);
      expect(response.headers["set-cookie"][0]).toContain("Secure");
    } finally {
      if (previous === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = previous;
    }
  });
  it("returns the same error for unknown users and wrong passwords", async () => {
    const wrong = await request(f.app)
      .post("/auth/login")
      .send({ email: f.ownerUser.email, password: "wrong" })
      .expect(401);
    const missing = await request(f.app)
      .post("/auth/login")
      .send({ email: "missing@test.example", password: "wrong" })
      .expect(401);
    expect(wrong.body).toEqual(missing.body);
    await request(f.app).post("/auth/login").send({ password: [] }).expect(400);
  });
  it("invalidates a copied session cookie on logout", async () => {
    const login = await f.owner
      .post("/auth/login")
      .send({ email: f.ownerUser.email, password: testPassword });
    const cookie = login.headers["set-cookie"][0];
    await f.owner.post("/auth/logout").send({}).expect(204);
    await request(f.app).get("/auth/me").set("Cookie", cookie).expect(401);
  });
  it("rejects expired and forged sessions", async () => {
    await f.db
      .updateTable("session")
      .set({ expires_at: new Date(0) })
      .execute();
    await f.owner.get("/auth/me").expect(401);
    await request(f.app)
      .get("/auth/me")
      .set("Cookie", "crewlink_session=forged")
      .expect(401);
  });
  it("uses the database role on every request and blocks inactive employees", async () => {
    await f.db
      .updateTable("technician")
      .set({ is_active: false })
      .where("technician_id", "=", f.technician.technician_id)
      .execute();
    await f.employee.get("/jobs").expect(403);
    await request(f.app)
      .post("/auth/login")
      .send({ email: f.employeeUser.email, password: testPassword })
      .expect(401);
    await f.db
      .updateTable("user")
      .set({ role: "technician" })
      .where("user_id", "=", f.ownerUser.user_id)
      .execute();
    await f.owner.get("/customers").expect(403);
  });
  it("blocks cross-site writes and non-JSON login", async () => {
    await f.owner
      .post("/auth/logout")
      .set("Origin", "https://evil.example")
      .send({})
      .expect(403);
    await request(f.app)
      .post("/auth/login")
      .type("form")
      .send({ email: f.ownerUser.email, password: testPassword })
      .expect(415);
    await f.owner.get("/auth/me").expect(200);
  });
  it("limits repeated login attempts", async () => {
    for (let i = 0; i < 10; i++)
      await request(f.app)
        .post("/auth/login")
        .send({ email: f.ownerUser.email, password: "wrong" })
        .expect(401);
    await request(f.app)
      .post("/auth/login")
      .send({ email: f.ownerUser.email, password: testPassword })
      .expect(429);
  });
  it("serves the login UI with security headers", async () => {
    const response = await request(f.app).get("/").expect(200);
    expect(response.text).toContain("Welcome back");
    expect(response.headers["content-security-policy"]).toContain(
      "script-src 'self'",
    );
    await request(f.app).get("/app.js").expect(200);
  });
});
