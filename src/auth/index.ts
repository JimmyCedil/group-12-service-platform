import { createHash, randomBytes } from "node:crypto";
import { Router, type RequestHandler } from "express";
import type { Kysely } from "kysely";
import type { Database } from "../db/types.js";
import { hashPassword, verifyPassword } from "./passwords.js";

export type Identity = {
  user_id: number;
  email: string;
  role: "owner" | "technician";
};
declare global {
  // Express exposes response locals through declaration merging.
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Locals {
      user: Identity;
    }
  }
}
const cookieName = "crewlink_session";
const digest = (token: string) =>
  createHash("sha256").update(token).digest("hex");
function readToken(header?: string): string | undefined {
  return header
    ?.split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${cookieName}=`))
    ?.slice(cookieName.length + 1);
}
const cookieOptions = () => ({
  httpOnly: true,
  sameSite: "strict" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
});
export const sameOrigin: RequestHandler = (req, res, next) => {
  if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    // JSON-only writes and strict cookies also protect requests without Origin.
    const expected =
      process.env.APP_ORIGIN?.trim() || `${req.protocol}://${req.get("host")}`;
    if (
      (req.get("origin") && req.get("origin") !== expected) ||
      req.get("sec-fetch-site") === "cross-site"
    ) {
      res.status(403).json({ error: "Cross-site requests are not allowed" });
      return;
    }
    if (!req.is("application/json")) {
      res.status(415).json({ error: "Use application/json" });
      return;
    }
  }
  next();
};
export function authentication(db: Kysely<Database>): RequestHandler {
  return async (req, res, next) => {
    const token = readToken(req.headers.cookie);
    if (!token || !/^[a-f0-9]{64}$/.test(token)) {
      res.status(401).json({ error: "Please sign in" });
      return;
    }
    const session = await db
      .selectFrom("session")
      .innerJoin("user", "user.user_id", "session.user_id")
      .select(["user.user_id", "user.email", "user.role"])
      .where("token_hash", "=", digest(token))
      .where("expires_at", ">", new Date())
      .executeTakeFirst();
    if (!session) {
      res.status(401).json({ error: "Session expired. Please sign in again" });
      return;
    }
    if (session.role === "technician") {
      const active = await db
        .selectFrom("technician")
        .select("technician_id")
        .where("user_id", "=", session.user_id)
        .where("is_active", "=", true)
        .executeTakeFirst();
      if (!active) {
        res.status(403).json({ error: "Employee account is inactive" });
        return;
      }
    }
    res.locals.user = session;
    next();
  };
}
export const ownerOnly: RequestHandler = (_req, res, next) => {
  if (res.locals.user.role !== "owner") {
    res.status(403).json({ error: "Owner access required" });
    return;
  }
  next();
};
export function createAuthRouter(db: Kysely<Database>): Router {
  const router = Router();
  const attempts = new Map<string, { count: number; until: number }>();
  const dummyHash = hashPassword(randomBytes(32).toString("hex"));
  router.post("/login", async (req, res) => {
    res.set("Cache-Control", "no-store");
    const key = req.ip ?? "unknown";
    const now = Date.now();
    for (const [ip, value] of attempts)
      if (value.until <= now) attempts.delete(ip);
    const attempt = attempts.get(key);
    if (attempt && attempt.count >= 10) {
      res.set("Retry-After", String(Math.ceil((attempt.until - now) / 1000)));
      return res
        .status(429)
        .json({ error: "Too many attempts. Try again in 15 minutes" });
    }
    if (!attempts.has(key) && attempts.size >= 10000)
      return res.status(429).json({ error: "Please try again later" });
    attempts.set(key, {
      count: (attempt?.count ?? 0) + 1,
      until: attempt?.until ?? now + 15 * 60 * 1000,
    });
    const { email, password } = req.body ?? {};
    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      email.length > 254 ||
      password.length > 1024 ||
      !email.trim() ||
      !password
    )
      return res.status(400).json({ error: "Email and password are required" });
    const user = await db
      .selectFrom("user")
      .selectAll()
      .where("email", "=", email.trim().toLowerCase())
      .executeTakeFirst();
    const valid = await verifyPassword(
      password,
      user?.password_hash ?? (await dummyHash),
    );
    if (!user || !valid)
      return res.status(401).json({ error: "Incorrect email or password" });
    if (user.role === "technician") {
      const active = await db
        .selectFrom("technician")
        .select("technician_id")
        .where("user_id", "=", user.user_id)
        .where("is_active", "=", true)
        .executeTakeFirst();
      if (!active)
        return res.status(401).json({ error: "Incorrect email or password" });
    }
    attempts.delete(key);
    const oldToken = readToken(req.headers.cookie);
    if (oldToken)
      await db
        .deleteFrom("session")
        .where("token_hash", "=", digest(oldToken))
        .execute();
    await db
      .deleteFrom("session")
      .where("expires_at", "<=", new Date())
      .execute();
    const token = randomBytes(32).toString("hex");
    const maxAge = 8 * 60 * 60 * 1000;
    await db
      .insertInto("session")
      .values({
        token_hash: digest(token),
        user_id: user.user_id,
        expires_at: new Date(now + maxAge),
      })
      .execute();
    res.cookie(cookieName, token, { ...cookieOptions(), maxAge });
    return res.json({
      user: { user_id: user.user_id, email: user.email, role: user.role },
    });
  });
  router.post("/logout", async (req, res) => {
    const token = readToken(req.headers.cookie);
    if (token)
      await db
        .deleteFrom("session")
        .where("token_hash", "=", digest(token))
        .execute();
    res.clearCookie(cookieName, cookieOptions());
    return res.status(204).end();
  });
  router.get("/me", authentication(db), (_req, res) => {
    res.set("Cache-Control", "no-store").json({ user: res.locals.user });
  });
  return router;
}
