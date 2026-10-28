# Group 12 Service Platform

A service business management app for organizing customers, jobs, technicians,
invoices, and payments.

## Current Progress

The backend uses TypeScript, Express, Kysely, and PostgreSQL. The app includes
an owner/employee login screen and a small role-aware workspace, served from
`public/` at the same origin as the API. No separate frontend build is needed.

- Sign in, restore your session on refresh, and sign out.
- Owners can access customer records, all jobs, and assignment management APIs.
- Employees can view and update progress only on their assigned jobs.
- Employee accounts use the existing database role `technician`; the UI calls
  this role “Employee.” Inactive technicians cannot sign in or use an old session.
- Jobs are now stored in PostgreSQL so permissions use real assignment records.
- Scheduling forms are the next task (#6). Customer management UI remains
  separate from this login issue; the workspace includes a read-only directory.
- Photo uploads, registration, password reset, and invoice UI are not implemented.

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
002_sessions: Success
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

## Login and permissions (issue #4)

After starting PostgreSQL, apply migrations and create development accounts:

```bash
npm run db:migrate
```

Add `DEV_ACCOUNT_PASSWORD` (at least 12 characters) to your local `.env`, then run:

```bash
npm run db:seed:accounts
npm run dev
```

Open http://localhost:3000 and sign in as `owner@crewlink.test` or
`employee@crewlink.test`, using your chosen `DEV_ACCOUNT_PASSWORD`.
The seed runs in a transaction, never resets existing accounts, and refuses
production mode. There are no hardcoded default passwords. An employee must
have a linked, active technician record. No public sign-up endpoint is exposed.

The workspace uses HTML/CSS/JavaScript because this repository has no frontend
framework yet. It follows the navy/teal CrewLink reference, supports mobile
layouts, and can be replaced by a React frontend using the same API contract.

### API contract

All write requests require `Content-Type: application/json` (including logout).
Use the same origin as the frontend; cross-site writes are rejected. Browser
requests automatically include the HTTP-only session cookie; do not store
passwords or session tokens in localStorage. For a separate frontend during
future development, proxy API requests through its dev server rather than
opening cross-origin credential access.

| Method | Endpoint                | Access and purpose                                                                                    |
| ------ | ----------------------- | ----------------------------------------------------------------------------------------------------- |
| POST   | `/auth/login`           | `{ "email": "...", "password": "..." }`; returns `{ user: { user_id, email, role } }`                 |
| GET    | `/auth/me`              | Current user, same response shape; 401 if signed out/expired                                          |
| POST   | `/auth/logout`          | Send `{}`; revokes the session and clears the cookie; 204                                             |
| GET    | `/customers`            | Owner only; customer directory                                                                        |
| POST   | `/customers`            | Owner only; creates a customer                                                                        |
| GET    | `/jobs`                 | Owners: all jobs. Employees: assigned jobs only                                                       |
| GET    | `/jobs/:id`             | Same access rules; inaccessible jobs return 404                                                       |
| POST   | `/jobs`                 | Owner only; creates a persistent requested job                                                        |
| PATCH  | `/jobs/:id`             | `{ "status": "in_progress" }` or `{ "status": "completed" }`; employees may change assigned jobs only |
| GET    | `/technicians`          | Owner only; technician IDs for assignments                                                            |
| GET    | `/jobs/:id/assignments` | Owner only; current assignments                                                                       |
| PUT    | `/jobs/:id/assignments` | Owner only; `{ "technician_ids": [1, 2] }` replaces the whole assignment set; `[]` clears it          |

Owners can also set `requested` or `scheduled` via the status endpoint. Only
`status` is accepted by PATCH, so callers cannot alter ownership, assignments,
or account roles through that endpoint. Scheduling dates/forms belong to #6.

Customer creation requires non-empty string fields: `first_name`, `last_name`,
`email`, `phone`, `street`, `city`, `state`, `zip_code`; email must be valid.
Job creation requires positive integer `customer_id`, `service_id`, plus
non-empty `title` and `description`. The customer and active service must exist.
Optional address fields are strings: `service_street`, `service_city`,
`service_state`, `service_zip_code`. Omitted addresses are saved as empty strings.
Legacy mixed-case request names such as `customer_ID` remain accepted, but
responses now use the database's **snake_case** field names and lowercase job
statuses. Phone numbers and ZIP codes are strings to preserve formatting.

### Security and deployment

Sessions expire after eight hours and survive server restarts. Only a SHA-256
hash of each random session token is stored in PostgreSQL. Passwords use salted
scrypt hashes. Logout revokes the server-side session, and login rotates it.
Incorrect credentials use a generic error. Login attempts are limited to ten
per IP in fifteen minutes, per application process; multi-instance deployments
need a shared rate limiter. Behind a proxy, configure trusted proxy handling
before relying on per-client IP throttling.

Production requires HTTPS, `NODE_ENV=production` (Secure cookies), and
`APP_ORIGIN` set to the public origin, for example `https://crewlink.example`.
Expired sessions are cleaned up on successful login. Password reset/account
provisioning beyond the development seed is separate work.

### Verification

With a local PostgreSQL `DATABASE_URL` set, run:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Tests create isolated schemas and remove them afterward. They cover login,
logout/revocation, expired/forged sessions, role changes, inactive employees,
owner-only customers and assignments, job-ID guessing, disallowed update fields,
CSRF protections, rate limiting, and persistent jobs/customers.

Manual demo: sign in as owner, sign out, then sign in as employee. The employee
sees only My Jobs and no Customers navigation. Seeded employees initially have
no assigned jobs; assign a database job through the owner-only assignment API
before demonstrating status updates. No sample dashboard counts are fabricated.

## Commands

| Command              | Purpose                                |
| -------------------- | -------------------------------------- |
| `npm run dev`        | Run the server with automatic restarts |
| `npm run db:migrate` | Apply pending database migrations      |
| `npm run typecheck`  | Check TypeScript types                 |
| `npm run lint`       | Check coding issues                    |
| `npm test`           | Run automated tests                    |
| `npm run build`      | Compile TypeScript into `dist`         |
| `npm start`          | Run the compiled server after building |

## Project Structure

- `src/app.ts`: Express app factory, health endpoint, and route registration
- `src/server.ts`: Database migration and server startup
- `public/`: Login and role-aware workspace frontend
- `src/auth/`: Password hashing, sessions, and permission middleware
- `src/routes/`: Jobs and customer API routes
- `src/db/`: PostgreSQL connection, database types, and Kysely migrations
- `src/tests/`: Automated API and database tests
- `docs/architecture/`: ERD and design documents
