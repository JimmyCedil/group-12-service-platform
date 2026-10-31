import "dotenv/config";
import { createDatabase } from "./index.js";
import { migrateDatabase } from "./migrate.js";
import { hashPassword } from "../auth/passwords.js";
const db = createDatabase();
try {
  if (process.env.NODE_ENV === "production")
    throw new Error("Development account seeding is disabled in production");
  const password = process.env.DEV_ACCOUNT_PASSWORD;
  if (!password || password.length < 12)
    throw new Error("Set DEV_ACCOUNT_PASSWORD to at least 12 characters");
  await migrateDatabase(db);
  await db.transaction().execute(async (trx) => {
    for (const role of ["owner", "technician"] as const) {
      const email =
        role === "owner" ? "owner@crewlink.test" : "employee@crewlink.test";
      // Never reset existing passwords or roles on repeated runs.
      const user = await trx
        .insertInto("user")
        .values({ email, role, password_hash: await hashPassword(password) })
        .onConflict((c) => c.column("email").doNothing())
        .returning("user_id")
        .executeTakeFirst();
      if (role === "technician" && user)
        await trx
          .insertInto("technician")
          .values({
            user_id: user.user_id,
            first_name: "Demo",
            last_name: "Employee",
            phone: "0000000000",
          })
          .execute();
    }
  });
  console.log(
    "Development accounts ready: owner@crewlink.test and employee@crewlink.test",
  );
} finally {
  await db.destroy();
}
