# Group 12 Service Platform

A service business management app for organizing customers, jobs,
technicians, invoices, and payments.

## Current progress

The backend foundation is set up with TypeScript and Express.
A health endpoint and an automated test are included.
Database connections and business features are still in development.

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
- `src/routes/`: Folder reserved for API routes
- `src/tests/`: Automated tests
- `docs/architecture/`: Folder reserved for the ERD and design documents

Git does not track empty folders. The routes and architecture folders
will appear in the repository when files are added to them.