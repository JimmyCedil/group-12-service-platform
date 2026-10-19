import express from "express";
import type { Express, Router } from "express";
import type { Kysely } from "kysely";
import type { Database } from "./db/types.js";
import { jobsRouter } from "./routes/jobs.js";
import { customersRouter } from "./routes/customers.js";
import { createPersistentCustomersRouter } from "./routes/persistentCustomers.js";

function createApplication(customerRoutes: Router): Express {
  const app = express();

  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.status(200).json({
      status: "ok",
      message: "Service platform API is running",
    });
  });

  app.use("/jobs", jobsRouter);
  app.use("/customers", customerRoutes);

  return app;
}

export function createApp(db: Kysely<Database>): Express {
  return createApplication(createPersistentCustomersRouter(db));
}

export const app = createApplication(customersRouter);
