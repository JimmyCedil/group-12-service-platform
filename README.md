# Group 12 Service Platform

A service business management app for organizing customers, jobs, technicians,
invoices, and payments.

## Current Progress

The backend uses TypeScript, Express, Kysely, and PostgreSQL.
Migrations create nine application tables, including user accounts and
job photo metadata. Customer records are stored in PostgreSQL.
Jobs currently use temporary in-memory storage and are lost when the
server restarts. Authentication and photo uploads are not implemented yet.

## Tools

- Node.js 24
- TypeScript
- Express
- Kysely and PostgreSQL
- Docker Desktop for local PostgreSQL
- dotenv
- Vitest and Supertest
- ESLint

## Setup

## Setup

### Requirements

- Node.js 24 and npm
- Git
- Docker Desktop

### 1. Download the project

```bash
git clone https://github.com/JimmyCedil/group-12-service-platform.git
cd group-12-service-platform
```

### 2. Install dependencies

```bash
npm ci
```

### 3. Set up environment variables

Copy the example configuration:

```bash
cp .env.example .env
```

The local configuration should contain:

```dotenv
PORT=3000
DATABASE_URL=postgres://service_platform:local_dev_password@localhost:5433/service_platform
```

These credentials are for local development only. Do not commit `.env`.

### 4. Start PostgreSQL

Open Docker Desktop and wait for its engine to start. Then run:

```bash
docker compose up -d
```

Check the database status:

```bash
docker compose ps
```

Wait until the database shows `healthy`. PostgreSQL uses port 5433
on your computer.

### 5. Create the database tables

```bash
npm run db:migrate
```

On the first run, a successful migration reports:

```text
001_initial_schema: Success
```

### 6. Start the development server

```bash
npm run dev
```

Open http://localhost:3000/health in your browser. You should see:

```json
{
  "status": "ok",
  "message": "Service platform API is running"
}
```

Press Control + C in the terminal to stop the app.

### 7. Run the checks

Keep PostgreSQL running, then run:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

The database tests create and remove temporary schemas without
clearing the app's tables.

### Stop the local database

```bash
docker compose stop
```

Start it again with `docker compose up -d`. Database data is preserved
in a Docker volume.

## Health Check

- **Method:** `GET`
- **Endpoint:** `/health`
- **Success response:** `200 OK`

Returns a JSON message indicating that the API is running.

## Jobs API

The Jobs API allows clients to create jobs and retrieve the current list of
jobs. Jobs are stored in memory and are not saved between server restarts.

### Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/jobs` | Create a new job |
| `GET` | `/jobs` | Retrieve all jobs |

### Create a Job

Send a JSON request to `POST /jobs` with these required fields:

- `customer_ID`: Positive integer identifying the customer
- `service_ID`: Positive integer identifying the service
- `title`: Non-empty string describing the job
- `description`: Non-empty string with details about the job

Optional fields include `service_Street`, `service_City`, `service_State`, and
`service_Zip_Code`.

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

A successful request returns `201 Created` with the new job, including a
generated `job_ID`, a `REQUESTED` status, and a `requested_At` timestamp.
Scheduling and completion timestamps are initially `null`. Invalid request
data returns `400 Bad Request` with an error message.

Send a `GET` request to `/jobs` to retrieve all jobs currently stored in memory.
The endpoint returns `200 OK` with a JSON array, or an empty array if no jobs
have been created during the current run.

## Customers API

The Customers API stores customer records in the configured SQLite database,
so they remain available after the server restarts.

### Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/customers` | Create a customer |
| `GET` | `/customers` | Retrieve all customers |

### Create a Customer

Send a JSON request to `POST /customers`. All fields below are required by the
current database schema:

- `first_name`, `last_name`: Non-empty strings
- `email`: Valid email address
- `phone`: Integer
- `street`, `city`, `state`: Non-empty strings
- `zip_code`: Non-negative integer

The `customer_id` is generated automatically.

Example request:

```bash
curl -X POST http://localhost:3000/customers \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Jane",
    "last_name": "Smith",
    "email": "jane@example.com",
    "phone": 7045550123,
    "street": "123 Main Street",
    "city": "Charlotte",
    "state": "NC",
    "zip_code": 28202
  }'
```

A successful request returns `201 Created` with the stored customer, including
its generated `customer_id`. Invalid request data returns `400 Bad Request`
with an error message.

Send a `GET` request to `/customers` to retrieve all stored customers. The
endpoint returns `200 OK` with a JSON array, or an empty array if no customers
have been created.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Run the server with automatic restarts |
| `npm run db:migrate` | Apply pending database migrations |
| `npm run typecheck` | Check TypeScript types |
| `npm run lint` | Check coding issues |
| `npm test` | Run automated tests |
| `npm run build` | Compile TypeScript into `dist` |
| `npm start` | Run the compiled server after building |

## Project Structure

- `src/app.ts`: Express app factory, health endpoint, and route registration
- `src/server.ts`: Database migration and server startup
- `src/routes/`: Jobs and customer API routes
- `src/db/`: SQLite connection, database types, and Kysely migrations
- `src/tests/`: Automated API and database tests
- `docs/architecture/`: ERD and design documents
