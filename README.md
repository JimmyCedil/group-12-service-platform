# Group 12 Service Platform

A service business management app for organizing customers, jobs,
technicians, invoices, and payments.

## Current progress

The backend foundation is set up with TypeScript and Express.
The health endpoint and in-memory Jobs API are implemented and tested.
Database connections and other business features are still in development.

## Jobs API

The Jobs API allows clients to create jobs and retrieve the current list
of jobs. Jobs are stored in memory and are not saved between server restarts.

### Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/jobs` | Create a new job |
| `GET` | `/jobs` | Retrieve all jobs |

### Create a job

Send a JSON request to `POST /jobs` with the following required fields:

- `customer_ID`: Positive integer identifying the customer
- `service_ID`: Positive integer identifying the service
- `title`: Non-empty string describing the job
- `description`: Non-empty string with details about the job

Optional fields include `service_Street`, `service_City`, `service_State`,
and `service_Zip_Code`.

Example request:

```json
{
  "customer_ID": 1,
  "service_ID": 2,
  "title": "Kitchen sink repair",
  "description": "Repair a leaking pipe",
  "service_Street": "123 Main Street",
  "service_City": "Charlotte",
  "service_State": "NC",
  "service_Zip_Code": 28202
}
```

A successful request returns `201 Created` with the new job, including
a generated `job_ID`, a `REQUESTED` status, and a `requested_At` timestamp.
Scheduling and completion timestamps are initially `null`.

Invalid request data returns `400 Bad Request` with an error message.

### List jobs

Send a `GET` request to `/jobs` to retrieve all jobs currently stored
in memory. The endpoint returns `200 OK` with a JSON array.

Example:

```bash
curl http://localhost:3000/jobs
```

### Testing

Run the automated tests with:

```bash
npm test
```

## Tools

- Node.js 24
- TypeScript
- Express
- dotenv
- Vitest and Supertest
- ESLint

## Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/JimmyCedil/group-12-service-platform.git
   ```

2. Enter the project folder:

   ```bash
   cd group-12-service-platform
   ```

3. Install dependencies:

   ```bash
   npm ci
   ```

4. Copy the example configuration:

   ```bash
   cp .env.example .env
   ```

5. Start the development server:

   ```bash
   npm run dev
   ```

6. Open http://localhost:3000/health to check that the server works.

Press Control + C in the terminal to stop the server.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Run the server with automatic restarts |
| `npm run typecheck` | Check TypeScript types |
| `npm run lint` | Check coding issues |
| `npm test` | Run automated tests |
| `npm run build` | Compile TypeScript into dist |
| `npm start` | Run the compiled server after building |

## Project structure

- `src/app.ts`: Express app and health endpoint
- `src/server.ts`: Server startup and environment configuration
- `src/routes/jobs.ts`: Jobs API endpoints and input validation
- `src/tests/`: Automated tests
- `docs/architecture/`: Folder reserved for the ERD and design documents

Git does not track empty folders. The routes and architecture folders
will appear in the repository when files are added to them.