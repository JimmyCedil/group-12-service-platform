
import { Router } from "express";

type Customer = {
  customer_ID: number;
  first_Name: string;
  last_Name: string;
  email: string;
  phone: string;
  street: string | null;
  city: string | null;
  state: string | null;
  zip_Code: number | null;
};

export const customersRouter = Router();

const customers: Customer[] = [];
let nextCustomerId = 1;

// GET /customers - Return all customers for this instance
customersRouter.get("/", (_req, res) => {
  return res.status(200).json(customers);
});

// POST /customers - Add a customer
customersRouter.post("/", (req, res) => {
  const body: unknown = req.body;

  if (
    body === null ||
    typeof body !== "object" ||
    Array.isArray(body)
  ) {
    return res.status(400).json({
      error: "Request body must be a JSON object",
    });
  }

  const input = body as Record<string, unknown>;
  const { first_Name, last_Name, email, phone } = input;

  if (
    typeof first_Name !== "string" ||
    first_Name.trim().length === 0 ||
    typeof last_Name !== "string" ||
    last_Name.trim().length === 0 ||
    typeof email !== "string" ||
    email.trim().length === 0 ||
    typeof phone !== "string" ||
    phone.trim().length === 0
  ) {
    return res.status(400).json({
      error:
        "first_Name, last_Name, email, and phone must be non-empty strings",
    });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({
      error: "email must be a valid email address",
    });
  }

  const optionalStringFields = ["street", "city", "state"];

  for (const field of optionalStringFields) {
    if (
      input[field] !== undefined &&
      input[field] !== null &&
      typeof input[field] !== "string"
    ) {
      return res.status(400).json({
        error: `${field} must be a string or null`,
      });
    }
  }

  if (
    input.zip_Code !== undefined &&
    input.zip_Code !== null &&
    (!Number.isInteger(input.zip_Code) ||
      (input.zip_Code as number) < 0)
  ) {
    return res.status(400).json({
      error: "zip_Code must be a non-negative integer or null",
    });
  }

  const customer: Customer = {
    customer_ID: nextCustomerId++,
    first_Name: first_Name.trim(),
    last_Name: last_Name.trim(),
    email: email.trim(),
    phone: phone.trim(),
    street: (input.street as string | null | undefined) ?? null,
    city: (input.city as string | null | undefined) ?? null,
    state: (input.state as string | null | undefined) ?? null,
    zip_Code: (input.zip_Code as number | null | undefined) ?? null,
  };

  customers.push(customer);

  return res.status(201).json(customer);
});
