import { randomUUID } from "node:crypto";
import { Router } from "express";

interface Customer {
  id: string;
  name: string;
  email: string;
}

export function createCustomersRouter(customers: Customer[] = []): Router {
  const router = Router();

  router.get("/", (_req, res) => {
    res.json(customers);
  });

  router.post("/", (req, res) => {
    const { name, email } = req.body ?? {};
    if (
      typeof name !== "string" ||
      name.trim() === "" ||
      typeof email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
      res.status(400).json({ error: "A name and valid email are required" });
      return;
    }

    const customer = {
      id: randomUUID(),
      name: name.trim(),
      email: email.trim()
    };
    customers.push(customer);
    res.status(201).json(customer);
  });

  return router;
}
