import express from "express";
import { jobsRouter } from "./routes/jobs.js";
import { customersRouter } from "./routes/customers.js";

export const app = express();

app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Service platform API is running",
  });
});

app.use("/jobs", jobsRouter);
app.use("/customers", customersRouter);
