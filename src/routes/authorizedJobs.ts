import { Router } from "express";
import type { Kysely } from "kysely";
import type { Database } from "../db/types.js";
import { ownerOnly, type Identity } from "../auth/index.js";

export function createAuthorizedJobsRouter(db: Kysely<Database>): Router {
  const router = Router();
  const visibleJobs = (user: Identity) => {
    let query = db.selectFrom("job").selectAll("job");
    if (user.role === "technician")
      query = query.where(
        "job.job_id",
        "in",
        db
          .selectFrom("job_assignment")
          .innerJoin(
            "technician",
            "technician.technician_id",
            "job_assignment.technician_id",
          )
          .select("job_assignment.job_id")
          .where("technician.user_id", "=", user.user_id)
          .where("technician.is_active", "=", true),
      );
    return query;
  };
  router.param("id", (req, res, next, value: string) => {
    if (!/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value))) {
      res.status(400).json({ error: "Invalid job ID" });
      return;
    }
    next();
  });
  router.get("/", async (_req, res) => {
    res.json(
      await visibleJobs(res.locals.user)
        .orderBy("job.job_id", "desc")
        .execute(),
    );
  });
  router.get("/:id", async (req, res) => {
    const job = await visibleJobs(res.locals.user)
      .where("job.job_id", "=", Number(req.params.id))
      .executeTakeFirst();
    if (!job) return res.status(404).json({ error: "Job not found" });
    return res.json(job);
  });
  // Owners schedule jobs; the server controls their initial status.
  router.post("/", ownerOnly, async (req, res) => {
    const body = req.body;
    if (!body || typeof body !== "object" || Array.isArray(body))
      return res
        .status(400)
        .json({ error: "Request body must be a JSON object" });
    const customer = body.customer_id ?? body.customer_ID;
    const service = body.service_id ?? body.service_ID;
    if (
      !Number.isSafeInteger(customer) ||
      customer <= 0 ||
      !Number.isSafeInteger(service) ||
      service <= 0 ||
      typeof body.title !== "string" ||
      !body.title.trim() ||
      typeof body.description !== "string" ||
      !body.description.trim()
    )
      return res
        .status(400)
        .json({
          error:
            "Valid customer_id, service_id, title and description are required",
        });
    const address = {
      service_street: body.service_street ?? body.service_Street ?? "",
      service_city: body.service_city ?? body.service_City ?? "",
      service_state: body.service_state ?? body.service_State ?? "",
      service_zip_code: body.service_zip_code ?? body.service_Zip_Code ?? "",
    };
    if (Object.values(address).some((value) => typeof value !== "string"))
      return res.status(400).json({ error: "Address fields must be strings" });
    if (Object.values(address).some(value => !value.trim()))
      return res.status(400).json({ error: "A complete service address is required" });
    // Require an explicit offset so browser and server time zones cannot shift a job.
    const schedule = body.scheduled_at;
    const match = typeof schedule === "string" && /^(\d{4})-(\d{2})-(\d{2})T([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d)(?:\.\d{1,3})?)?(Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/.exec(schedule);
    const scheduledAt = new Date(typeof schedule === "string" ? schedule : "invalid");
    if (!match || !Number.isFinite(scheduledAt.getTime()))
      return res.status(400).json({ error: "A valid date and time with a time zone are required" });
    const calendar = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
    if (calendar.getUTCFullYear() !== Number(match[1]) || calendar.getUTCMonth() !== Number(match[2]) - 1 || calendar.getUTCDate() !== Number(match[3]))
      return res.status(400).json({ error: "Choose a valid calendar date" });
    if (body.instructions !== undefined && typeof body.instructions !== "string")
      return res.status(400).json({ error: "Instructions must be text" });
    const foundCustomer = await db
      .selectFrom("customer")
      .select("customer_id")
      .where("customer_id", "=", customer)
      .executeTakeFirst();
    const foundService = await db
      .selectFrom("service")
      .select("service_id")
      .where("service_id", "=", service)
      .where("is_active", "=", true)
      .executeTakeFirst();
    if (!foundCustomer || !foundService)
      return res
        .status(400)
        .json({ error: "Choose an existing customer and active service" });
    const job = await db
      .insertInto("job")
      .values({
        customer_id: customer,
        service_id: service,
        title: body.title.trim(),
        description: body.description.trim(),
        service_street: address.service_street.trim(),
        service_city: address.service_city.trim(),
        service_state: address.service_state.trim(),
        service_zip_code: address.service_zip_code.trim(),
        scheduled_at: scheduledAt,
        status: "scheduled",
        instructions: (body.instructions ?? "").trim(),
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    return res.status(201).json(job);
  });
  router.patch("/:id", async (req, res) => {
    const body = req.body;
    // Employees can update progress only, never assignment, customer or role fields.
    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body) ||
      Object.keys(body).length !== 1 ||
      !Object.hasOwn(body, "status") ||
      !["requested", "scheduled", "in_progress", "completed"].includes(
        body.status,
      )
    )
      return res.status(400).json({ error: "Send only a valid status" });
    if (
      res.locals.user.role === "technician" &&
      !["in_progress", "completed"].includes(body.status)
    )
      return res
        .status(403)
        .json({ error: "Employees may only start or complete assigned jobs" });
    const job = await db
      .updateTable("job")
      .set({
        status: body.status,
        completed_at: body.status === "completed" ? new Date() : null,
      })
      .where(
        "job_id",
        "in",
        visibleJobs(res.locals.user)
          .clearSelect()
          .select("job.job_id")
          .where("job.job_id", "=", Number(req.params.id)),
      )
      .returningAll()
      .executeTakeFirst();
    if (!job) return res.status(404).json({ error: "Job not found" });
    return res.json(job);
  });
  router.get("/:id/assignments", ownerOnly, async (req, res) => {
    return res.json(
      await db
        .selectFrom("job_assignment")
        .selectAll()
        .where("job_id", "=", Number(req.params.id))
        .execute(),
    );
  });
  router.put("/:id/assignments", ownerOnly, async (req, res) => {
    const ids: unknown = req.body?.technician_ids;
    if (
      !Array.isArray(ids) ||
      ids.some((id) => !Number.isSafeInteger(id) || id <= 0) ||
      new Set(ids).size !== ids.length
    )
      return res
        .status(400)
        .json({
          error: "technician_ids must contain unique positive integers",
        });
    const result = await db.transaction().execute(async (trx) => {
      const job = await trx
        .selectFrom("job")
        .select("job_id")
        .where("job_id", "=", Number(req.params.id))
        .forUpdate()
        .executeTakeFirst();
      if (!job) return 404;
      if (ids.length) {
        const active = await trx
          .selectFrom("technician")
          .select("technician_id")
          .where("technician_id", "in", ids as number[])
          .where("is_active", "=", true)
          .execute();
        if (active.length !== ids.length) return 400;
      }
      await trx
        .deleteFrom("job_assignment")
        .where("job_id", "=", job.job_id)
        .execute();
      if (ids.length)
        await trx
          .insertInto("job_assignment")
          .values(
            (ids as number[]).map((technician_id) => ({
              job_id: job.job_id,
              technician_id,
            })),
          )
          .execute();
      return 204;
    });
    if (result !== 204)
      return res
        .status(result)
        .json({
          error: result === 404 ? "Job not found" : "Choose active technicians",
        });
    return res.status(204).end();
  });
  return router;
}
