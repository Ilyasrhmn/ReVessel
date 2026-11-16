import "server-only";
import { Pool } from "pg";

const runtime = globalThis as typeof globalThis & { revesselPool?: Pool };

export function db() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
  if (runtime.revesselPool) return runtime.revesselPool;
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 4,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 10_000,
  });
  pool.on("error", (error) => console.error("Idle PostgreSQL connection closed", error.name));
  return runtime.revesselPool = pool;
}
