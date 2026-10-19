import "dotenv/config";
import { createApp } from "./app.js";
import { createDatabase } from "./db/index.js";
import { migrateDatabase } from "./db/migrate.js";

const port = Number(process.env.PORT ?? 3000);

async function startServer(): Promise<void> {
  const db = createDatabase();

  try {
    await migrateDatabase(db);
  } catch (error) {
    await db.destroy();
    throw error;
  }

  const app = createApp(db);
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

startServer().catch((error: unknown) => {
  console.error("Server startup failed:", error);
  process.exitCode = 1;
});