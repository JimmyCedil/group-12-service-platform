import express from "express";
import { createCustomersRouter } from "./routes/customers.js";

export function createApp() {
  const app = express();

  app.use(express.json());
  app.get("/health", (_req, res) => {
    res.status(200).json({
      status: "ok",
      message: "Service platform API is running"
    });
  });
  app.use("/customers", createCustomersRouter());

  return app;
}

export const app = createApp();