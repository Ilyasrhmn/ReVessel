import "server-only";
import { db } from "./db";
import type { Deposit } from "@/app/dashboard/deposit-store";

export async function readAdminDeposits(status: Deposit["status"] | null) {
  const pool = db();
  const [summary, recent] = await Promise.all([
    pool.query<{ waiting: number; accepted: number; adjustment: number; units: number }>(
      `SELECT COUNT(*) FILTER (WHERE status = 'waiting')::int AS waiting,
        COUNT(*) FILTER (WHERE status = 'accepted')::int AS accepted,
        COUNT(*) FILTER (WHERE status = 'adjustment')::int AS adjustment,
        COALESCE(SUM(quantity) FILTER (WHERE status = 'accepted'), 0)::int AS units
        FROM deposits`,
    ),
    pool.query<Pick<Deposit, "code" | "material" | "quantity" | "status" | "pointName"> & { date: Date }>(
      `SELECT d.code, d.material, d.quantity, d.status, p.name AS "pointName", d.created_at AS date
       FROM deposits d JOIN collection_points p ON p.slug = d.point_slug
       WHERE ($1::text IS NULL OR d.status = $1)
       ORDER BY d.created_at DESC, d.code LIMIT 25`, [status],
    ),
  ]);
  return { summary: summary.rows[0], entries: recent.rows };
}

export async function readAdminResidents() {
  const pool = db();
  const [total, recent] = await Promise.all([
    pool.query<{ total: number }>(`SELECT COUNT(*)::int AS total FROM "user" WHERE role = 'resident'`),
    pool.query<{ id: string; name: string; date: Date }>(
      `SELECT id, name, "createdAt" AS date FROM "user" WHERE role = 'resident'
       ORDER BY "createdAt" DESC, id LIMIT 25`,
    ),
  ]);
  return { total: total.rows[0].total, entries: recent.rows };
}
