# Group 12 Service Platform

A service business management app for organizing customers, jobs,
technicians, invoices, and payments.

## Current progress

<<<<<<< HEAD
The backend foundation is set up with TypeScript and Express.
A health endpoint and an automated test are included.
Database connections and business features are still in development.
=======
The backend uses TypeScript, Express, Kysely, and a local SQLite database.
The schema covers customers, services, jobs, technicians, job assignments,
invoices, and payments. Customer create/list endpoints are available.
>>>>>>> 9529ef4 (Connect database and apply migrations)

## Tools

- Node.js 24
- TypeScript
- Express
<<<<<<< HEAD
=======
- Kysely and SQLite
>>>>>>> 9529ef4 (Connect database and apply migrations)
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

<<<<<<< HEAD
5. Start the development server:
=======
   `DATABASE_PATH` defaults to `./data/service-platform.db`. The app creates
   the containing `data` directory and applies pending migrations at startup.
   SQLite runs in-process; no database server is required.

5. Apply database migrations (optional because the server also applies them
   automatically):

   ```bash
   npm run db:migrate
   ```

6. Start the development server:
>>>>>>> 9529ef4 (Connect database and apply migrations)

   ```bash
   npm run dev
   ```

<<<<<<< HEAD
6. Open http://localhost:3000/health to check that the server works.
=======
7. Open http://localhost:3000/health to check that the server works.
   Use `POST /customers` to create a customer and `GET /customers` to list
   saved customers.
>>>>>>> 9529ef4 (Connect database and apply migrations)

Press Control + C in the terminal to stop the server.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Run the server with automatic restarts |
<<<<<<< HEAD
=======
| `npm run db:migrate` | Apply pending database migrations |
>>>>>>> 9529ef4 (Connect database and apply migrations)
| `npm run typecheck` | Check TypeScript types |
| `npm run lint` | Check coding issues |
| `npm test` | Run automated tests |
| `npm run build` | Compile TypeScript into dist |
| `npm start` | Run the compiled server after building |

## Project structure

<<<<<<< HEAD
- `src/app.ts`: Express app and health endpoint
- `src/server.ts`: Server startup and environment configuration
- `src/routes/`: Folder reserved for API routes
- `src/tests/`: Automated tests
- `docs/architecture/`: Folder reserved for the ERD and design documents

Git does not track empty folders. The routes and architecture folders
will appear in the repository when files are added to them.
=======
- `src/app.ts`: Express app, health endpoint, and customer API
- `src/db/`: SQLite connection, database types, and Kysely migrations
- `src/server.ts`: Database migration and server startup
- `src/routes/`: Folder reserved for API routes
- `src/tests/`: Automated tests
- `docs/architecture/`: ERD and design documents

Git does not track empty folders. The routes folder will appear in the
repository when files are added to it.
>>>>>>> 9529ef4 (Connect database and apply migrations)
