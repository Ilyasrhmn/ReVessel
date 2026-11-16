import "server-only";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { headers } from "next/headers";
import { connection } from "next/server";
import { db } from "./db";

function createAuth() {
  return betterAuth({
    appName: "ReVessel",
    baseURL: process.env.BETTER_AUTH_URL,
    secret: process.env.BETTER_AUTH_SECRET,
    database: db(),
    emailAndPassword: { enabled: true, minPasswordLength: 12, maxPasswordLength: 128 },
    user: {
      additionalFields: {
        role: { type: ["resident", "reviewer", "admin"], input: false, defaultValue: "resident", required: false },
      },
    },
    rateLimit: {
      enabled: true,
      storage: "database",
      customRules: { "/sign-in/email": { window: 60, max: 8 }, "/sign-up/email": { window: 60, max: 4 } },
    },
    session: { expiresIn: 60 * 60 * 24 * 7, cookieCache: { enabled: false } },
    trustedOrigins: process.env.NODE_ENV === "development" ? ["http://localhost:3000", "http://127.0.0.1:3000"] : [],
    plugins: [nextCookies()],
  });
}

let instance: ReturnType<typeof createAuth> | undefined;

export function auth() {
  if (!process.env.BETTER_AUTH_SECRET || !process.env.BETTER_AUTH_URL) {
    throw new Error("Authentication environment is not configured");
  }
  return instance ??= createAuth();
}

export async function currentUser() {
  const requestHeaders = await headers();
  if (!requestHeaders.has("cookie") || !process.env.DATABASE_URL) return null;
  await connection();
  const session = await auth().api.getSession({ headers: requestHeaders });
  return session?.user ?? null;
}
