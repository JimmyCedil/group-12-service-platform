# Group 12 Service Platform

A service business management app for organizing customers, jobs,
technicians, invoices, and payments.

## Current progress

The backend foundation is set up with TypeScript and Express.
A health endpoint and a basic in-memory customer list are included.
Customer records are lost when the server restarts; database persistence
and the remaining business features are still in development.

## Tools

- Node.js 24
- TypeScript
- Express
- dotenv
- tsx
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

## Customer API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/customers` | List customers |
| `POST` | `/customers` | Add a customer with a name and valid email |

Customer data is stored in memory for demonstration and is not persisted.

## Project structure

- `src/app.ts`: Express app and health endpoint
- `src/server.ts`: Server startup and environment configuration
- `src/routes/customers.ts`: In-memory customer list and create endpoint
- `src/tests/`: Automated tests
- `docs/architecture/ERD.drawio` and `docs/architecture/ERD.svg`: Final ERD diagrams