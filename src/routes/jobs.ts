
import { Router } from "express";

type Job = {
  job_ID: number;
  customer_ID: number;
  service_ID: number;
  title: string;
  description: string;
  status: string;
  requested_At: string;
  scheduled_At: string | null;
  completed_At: string | null;
  service_Street: string | null;
  service_City: string | null;
  service_State: string | null;
  service_Zip_Code: number | null;
};

export const jobsRouter = Router();

const jobs: Job[] = [];
let nextJobId = 1;

jobsRouter.get("/", (_req, res) => {
  res.status(200).json(jobs);
});

jobsRouter.post("/", (req, res) => {
  const body: unknown = req.body;

  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return res.status(400).json({
      error: "Request body must be a JSON object",
    });
  }

  const input = body as Record<string, unknown>;

  const { customer_ID, service_ID, title, description } = input;

  if (
    !Number.isInteger(customer_ID) ||
    (customer_ID as number) <= 0 ||
    !Number.isInteger(service_ID) ||
    (service_ID as number) <= 0 ||
    typeof title !== "string" ||
    title.trim().length === 0 ||
    typeof description !== "string" ||
    description.trim().length === 0
  ) {
    return res.status(400).json({
      error:
        "customer_ID and service_ID must be positive integers; title and description must be non-empty strings",
    });
  }

  const optionalStringFields = [
    "service_Street",
    "service_City",
    "service_State",
  ];

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
    input.service_Zip_Code !== undefined &&
    input.service_Zip_Code !== null &&
    (!Number.isInteger(input.service_Zip_Code) ||
      (input.service_Zip_Code as number) < 0)
  ) {
    return res.status(400).json({
      error: "service_Zip_Code must be a non-negative integer or null",
    });
  }

  const job: Job = {
    job_ID: nextJobId++,
    customer_ID: customer_ID as number,
    service_ID: service_ID as number,
    title: title.trim(),
    description: description.trim(),
    status: "REQUESTED",
    requested_At: new Date().toISOString(),
    scheduled_At: null,
    completed_At: null,
    service_Street:
      (input.service_Street as string | null | undefined) ?? null,
    service_City: (input.service_City as string | null | undefined) ?? null,
    service_State:
      (input.service_State as string | null | undefined) ?? null,
    service_Zip_Code:
      (input.service_Zip_Code as number | null | undefined) ?? null,
  };

  jobs.push(job);

  return res.status(201).json(job);
});
