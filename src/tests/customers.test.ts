import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { fixture, customerData } from "./fixture.js";
describe("owner customer access", () => {
  let f: Awaited<ReturnType<typeof fixture>>;
  beforeEach(async () => {
    f = await fixture();
  });
  afterEach(async () => {
    await f?.cleanup();
  });
  it("lets owners add and view persistent customers", async () => {
    const created = await f.owner
      .post("/customers")
      .send(customerData)
      .expect(201);
    expect(created.body).toMatchObject(customerData);
    expect((await f.owner.get("/customers").expect(200)).body).toEqual([
      created.body,
    ]);
  });
  it("lets owners view an individual customer", async () => {
  const created = await f.owner
    .post("/customers")
    .send(customerData)
    .expect(201);
  const response = await f.owner
    .get(`/customers/${created.body.customer_id}`)
    .expect(200);
  expect(response.body).toEqual(created.body);
  });
  it("rejects invalid customer IDs", async () => {
  await f.owner.get("/customers/abc").expect(400);
  });
  it("returns 404 for a nonexistent customer", async () => {
  await f.owner.get("/customers/999999").expect(404);
  });
  it("blocks unauthenticated and employee access", async () => {
    await request(f.app).get("/customers").expect(401);
    await f.employee.get("/customers").expect(403);
    await f.employee.post("/customers").send(customerData).expect(403);
    await f.employee.get("/technicians").expect(403);
  });
  it("rejects incomplete data and invalid email without saving", async () => {
    await f.owner.post("/customers").send({ first_name: "Taylor" }).expect(400);
    await f.owner
      .post("/customers")
      .send({ ...customerData, email: "invalid" })
      .expect(400);
    await f.owner.get("/customers").expect(200, []);
  });
});
