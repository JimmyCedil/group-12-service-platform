import express from "express";
import type { Express, ErrorRequestHandler } from "express";
import { fileURLToPath } from "node:url";
import type { Kysely } from "kysely";
import type { Database } from "./db/types.js";
import { createPersistentCustomersRouter } from "./routes/persistentCustomers.js";
import { createAuthorizedJobsRouter } from "./routes/authorizedJobs.js";
import {
  authentication,
  createAuthRouter,
  ownerOnly,
  sameOrigin,
} from "./auth/index.js";

export function createApp(db: Kysely<Database>): Express {
  const app = express();
  app.disable("x-powered-by");
  app.use((_req, res, next) => {
    res.set({
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Referrer-Policy": "same-origin",
      "Content-Security-Policy":
        "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
    });
    next();
  });
  app.use(express.json({ limit: "16kb" }));
  app.get("/health", (_req, res) =>
    res.json({ status: "ok", message: "Service platform API is running" }),
  );
  app.use(sameOrigin);
  app.use("/auth", createAuthRouter(db));
  const signedIn = authentication(db);
  app.use(["/customers", "/jobs", "/technicians"], (_req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
  });
  app.use(
    "/customers",
    signedIn,
    ownerOnly,
    createPersistentCustomersRouter(db),
  );
  app.use("/jobs", signedIn, createAuthorizedJobsRouter(db));
  app.get("/technicians", signedIn, ownerOnly, async (_req, res) =>
    res.json(await db.selectFrom("technician").selectAll().execute()),
  );
  app.use(express.static(fileURLToPath(new URL("../public", import.meta.url))));
  app.use((_req, res) => {
    res.status(404).json({ error: "Not found" });
  });
  const errors: ErrorRequestHandler = (error, _req, res, _next) => {
    void _next;
    if (error instanceof SyntaxError && "body" in error) {
      res.status(400).json({ error: "Invalid JSON" });
      return;
    }
    console.error("Request failed", error);
    res.status(500).json({ error: "Something went wrong. Please try again" });
  };
  app.use(errors);
  return app;
}
