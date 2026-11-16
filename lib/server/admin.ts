import "server-only";
import { db } from "./db";
import type { DepositBucket } from "@/app/dashboard/deposit-analytics";
import type { Deposit } from "@/app/dashboard/deposit-store";

export async function readAdminDepositBuckets() {
  const { rows } = await db().query<Omit<DepositBucket, "createdAt"> & { day: Date }>(
    `SELECT date_trunc('day', created_at, 'Asia/Jakarta') AS day, material, status,
       count(*)::int AS count, sum(quantity)::int AS quantity
     FROM deposits WHERE created_at >= now() - interval '731 days'
     GROUP BY 1, 2, 3 ORDER BY 1, 2, 3`,
  );
  return rows.map(({ day, ...bucket }) => ({ ...bucket, createdAt: day.toISOString() }));
}

export async function readAdminDeposits(status: Deposit["status"] | null, limit: number) {
  const { rows: entries } = await db().query<Pick<Deposit, "code" | "material" | "quantity" | "status" | "pointName"> & { date: Date }>(
    `SELECT d.code, d.material, d.quantity, d.status, p.name AS "pointName", d.created_at AS date
     FROM deposits d JOIN collection_points p ON p.slug = d.point_slug
     WHERE ($1::text IS NULL OR d.status = $1)
     ORDER BY (d.status = 'pending_approval') DESC, d.created_at DESC, d.code LIMIT $2`, [status, limit],
  );
  return { entries };
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
