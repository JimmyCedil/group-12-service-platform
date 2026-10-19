# Group 12 Service Platform

A service business management app for organizing customers, jobs, technicians, invoices, and payments.

## Current Progress

The backend foundation is set up with TypeScript and Express. The health endpoint, in-memory Jobs API, and in-memory Customers API are implemented and tested. Database connections and other business features are still in development.

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

6. Open <http://localhost:3000/health> to check that the server works.

Press **Ctrl+C** in the terminal to stop the server.

## Health Check

- **Method:** `GET`
- **Endpoint:** `/health`
- **Success response:** `200 OK`

Returns a JSON message indicating that the API is running.

## Jobs API

The Jobs API allows clients to create jobs and retrieve the current list of jobs. Jobs are stored in memory and are not saved between server restarts.

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

Optional fields include `service_Street`, `service_City`, `service_State`, and `service_Zip_Code`.

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

A successful request returns `201 Created` with the new job, including a generated `job_ID`, a `REQUESTED` status, and a `requested_At` timestamp. Scheduling and completion timestamps are initially `null`.

Invalid request data returns `400 Bad Request` with an error message.

### List Jobs

Send a `GET` request to `/jobs` to retrieve all jobs currently stored in memory. The endpoint returns `200 OK` with a JSON array. If no jobs have been created during the current run, the response is an empty array.

Example:

```bash
curl http://localhost:3000/jobs
```

## Customers API

The Customers API allows an owner to add customers and view the customers stored in the current running instance. Customer records are currently held in memory and are lost when the server restarts.

### Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/customers` | Create a customer |
| `GET` | `/customers` | Retrieve all customers |

### Create a Customer

Send a JSON request to `POST /customers`.

Required fields:

- `first_Name`: Non-empty string
- `last_Name`: Non-empty string
- `email`: Valid email address
- `phone`: Non-empty string; use a string to preserve formatting and leading zeros

Optional address fields:

- `street`: String or `null`
- `city`: String or `null`
- `state`: String or `null`
- `zip_Code`: Non-negative integer or `null`

The `customer_ID` is generated automatically. If optional address fields are omitted, they default to `null`.

Example request:

```bash
curl -X POST http://localhost:3000/customers \
  -H "Content-Type: application/json" \
  -d '{
    "first_Name": "Jane",
    "last_Name": "Smith",
    "email": "jane@example.com",
    "phone": "336-555-0123",
    "street": "123 Main Street",
    "city": "Winston-Salem",
    "state": "NC",
    "zip_Code": 27101
  }'
```

A successful request returns `201 Created`. Example response:

```json
{
  "customer_ID": 1,
  "first_Name": "Jane",
  "last_Name": "Smith",
  "email": "jane@example.com",
  "phone": "336-555-0123",
  "street": "123 Main Street",
  "city": "Winston-Salem",
  "state": "NC",
  "zip_Code": 27101
}
```

Invalid request data returns `400 Bad Request` with an error message.

### List Customers

Send a `GET` request to `/customers` to retrieve all customers currently stored in memory. The endpoint returns `200 OK` with a JSON array, or an empty array if no customers have been created during the current run.

Example:

```bash
curl http://localhost:3000/customers
```

Each independently running instance maintains its own in-memory customer list. Customer records are not currently persisted to a database.

## Testing

Run the automated test suite with:

```bash
npm test
```

Other useful checks:

```bash
npm run typecheck
npm run lint
npm run build
```

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Run the server with automatic restarts |
| `npm run typecheck` | Check TypeScript types |
| `npm run lint` | Check coding issues |
| `npm test` | Run automated tests |
| `npm run build` | Compile TypeScript into `dist` |
| `npm start` | Run the compiled server after building |

## Tools

- Node.js 24
- TypeScript
- Express
- dotenv
- Vitest and Supertest
- ESLint

## Project Structure

- `src/app.ts`: Express app, health endpoint, and route registration
- `src/server.ts`: Server startup and environment configuration
- `src/routes/jobs.ts`: Jobs API endpoints and input validation
- `src/routes/customers.ts`: Customers API endpoints and input validation
- `src/tests/`: Automated tests for API routes
- `docs/architecture/`: ERD and design documents

Git does not track empty folders, so folders appear in the repository once files are added to them.
