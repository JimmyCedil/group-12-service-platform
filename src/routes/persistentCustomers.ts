import { Router } from "express";
import type { Kysely } from "kysely";
import type { Database } from "../db/types.js";

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function createPersistentCustomersRouter(
  db: Kysely<Database>,
): Router {
  const router = Router();

  // GET /customers - Retrieve all customers
  router.get("/", async (_req, res) => {
    const customers = await db
      .selectFrom("customer")
      .selectAll()
      .orderBy("customer_id")
      .execute();

    return res.status(200).json(customers);
  });

  // GET: Retrieve one customer by ID
  router.get("/:id", async (req, res) => {
    const customerId = Number(req.params.id);

    if (!Number.isInteger(customerId) || customerId <= 0) {
      return res.status(400).json({
        error: "Customer ID must be a positive integer",
      });
    }

    const customer = await db
      .selectFrom("customer")
      .selectAll()
      .where("customer_id", "=", customerId)
      .executeTakeFirst();

    if (!customer) {
      return res.status(404).json({
        error: "Customer not found",
      });
    }

    return res.status(200).json(customer);
  });
  // POST: Create a new customer
  router.post("/", async (req, res) => {
    const body: unknown = req.body;

    if (!isRecord(body)) {
      return res.status(400).json({
        error: "Request body must be a JSON object",
      });
    }

    if (
      !isNonEmptyString(body.first_name) ||
      !isNonEmptyString(body.last_name) ||
      !isNonEmptyString(body.email) ||
      !isNonEmptyString(body.phone) ||
      !isNonEmptyString(body.street) ||
      !isNonEmptyString(body.city) ||
      !isNonEmptyString(body.state) ||
      !isNonEmptyString(body.zip_code)
    ) {
      return res.status(400).json({
        error:
          "first_name, last_name, email, phone, street, city, state, and zip_code must be non-empty strings",
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) {
      return res.status(400).json({
        error: "email must be a valid email address",
      });
    }

    const customer = await db
      .insertInto("customer")
      .values({
        first_name: body.first_name.trim(),
        last_name: body.last_name.trim(),
        email: body.email.trim(),
        phone: body.phone.trim(),
        street: body.street.trim(),
        city: body.city.trim(),
        state: body.state.trim(),
        zip_code: body.zip_code.trim(),
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return res.status(201).json(customer);
  });

  return router;
}