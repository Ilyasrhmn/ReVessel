import "server-only";
import { randomBytes } from "node:crypto";
import { connection } from "next/server";
import { db } from "./db";
import type { CollectionPoint, Material } from "@/app/deposit-options";
import type { Deposit, FulfillmentMethod, PickupDetails, ReviewReason } from "@/app/dashboard/deposit-store";

type DepositRow = Omit<Deposit, "createdAt"> & { createdAt: Date };

const depositColumns = `d.code, d.material, d.quantity, d.status,
  d.reason, d.created_at AS "createdAt", p.name AS "pointName",
  d.fulfillment_method AS method, d.approval_note AS "approvalNote"`;

function fromRow(row: DepositRow): Deposit {
  const { reason, ...item } = row;
  return (row.status === "adjustment"
    ? { ...item, createdAt: row.createdAt.toISOString(), reason }
    : { ...item, createdAt: row.createdAt.toISOString() }) as Deposit;
}

export async function collectionPoints(reviewerId?: string) {
  await connection();
  if (!process.env.DATABASE_URL) return [];
  const result = await db().query<CollectionPoint>(
    `SELECT p.slug, p.name, p.address, p.materials
     FROM collection_points p
     WHERE p.active AND ($1::text IS NULL OR EXISTS (
       SELECT 1 FROM reviewer_assignments a WHERE a.point_slug = p.slug AND a.user_id = $1
     ))
     ORDER BY p.name, p.slug`, [reviewerId ?? null],
  );
  return result.rows;
}

export async function listResidentDeposits(userId: string) {
  const result = await db().query<DepositRow>(
    `SELECT ${depositColumns} FROM deposits d JOIN collection_points p ON p.slug = d.point_slug
     WHERE d.owner_id = $1 ORDER BY d.created_at DESC, d.code`, [userId],
  );
  return result.rows.map(fromRow);
}

export async function createResidentDeposit(userId: string, point: string, material: Material, quantity: number, requestId: string) {
  const values = [userId, point, material, quantity, requestId];
  for (let attempt = 0; attempt < 4; attempt++) {
    const code = `RV-${randomBytes(4).toString("hex").toUpperCase()}`;
    const result = await db().query<DepositRow>(
      `WITH d AS (
         INSERT INTO deposits (code, owner_id, point_slug, material, quantity, request_id)
         SELECT $6, $1, slug, $3, $4, $5 FROM collection_points
         WHERE slug = $2 AND active AND $3 = ANY(materials)
         ON CONFLICT DO NOTHING
         RETURNING *
       )
       SELECT ${depositColumns} FROM d JOIN collection_points p ON p.slug = d.point_slug`,
      [...values, code],
    );
    if (result.rows[0]) return fromRow(result.rows[0]);
    const prior = await db().query<DepositRow>(
      `SELECT ${depositColumns} FROM deposits d JOIN collection_points p ON p.slug = d.point_slug
       WHERE d.owner_id = $1 AND d.request_id = $2`, [userId, requestId],
    );
    if (prior.rows[0]) return fromRow(prior.rows[0]);
    const available = await db().query(
      "SELECT 1 FROM collection_points WHERE slug = $1 AND active AND $2 = ANY(materials)", [point, material],
    );
    if (!available.rowCount) return null;
  }
  return null;
}

export async function cancelResidentDeposit(userId: string, code: string) {
  const result = await db().query(
    `UPDATE deposits SET status = 'cancelled', pickup_address = NULL, pickup_phone = NULL
     WHERE owner_id = $1 AND code = $2 AND status IN ('pending_approval', 'approved', 'waiting')`,
    [userId, code],
  );
  return result.rowCount === 1;
}

export async function lookupAssignedDeposit(reviewerId: string, code: string, isAdmin: boolean) {
  const result = await db().query<DepositRow & { address: string | null; phone: string | null }>(
    `SELECT ${depositColumns},
       CASE WHEN $3 THEN d.pickup_address END AS address,
       CASE WHEN $3 THEN d.pickup_phone END AS phone
     FROM deposits d JOIN collection_points p ON p.slug = d.point_slug
     WHERE d.code = $2 AND p.active AND ($3::boolean OR EXISTS (
       SELECT 1 FROM reviewer_assignments a WHERE a.user_id = $1 AND a.point_slug = d.point_slug
     ))`, [reviewerId, code, isAdmin],
  );
  const row = result.rows[0];
  if (!row) return null;
  const { address, phone, ...deposit } = row;
  return { deposit: fromRow(deposit), pickup: address && phone ? { address, phone } : null };
}

export async function decideDepositApproval(operatorId: string, code: string, note: string | null, isAdmin: boolean) {
  const result = await db().query<DepositRow>(
    `WITH d AS (
       UPDATE deposits SET status = $3, approval_note = $4, decided_at = now(), decided_by = $1
       WHERE code = $2 AND status = 'pending_approval' AND EXISTS (
         SELECT 1 FROM collection_points p WHERE p.slug = deposits.point_slug AND p.active AND ($5::boolean OR EXISTS (
           SELECT 1 FROM reviewer_assignments a WHERE a.user_id = $1 AND a.point_slug = p.slug
         ))
       )
       RETURNING *
     )
     SELECT ${depositColumns} FROM d JOIN collection_points p ON p.slug = d.point_slug`,
    [operatorId, code, note ? "rejected" : "approved", note, isAdmin],
  );
  return result.rows[0] ? fromRow(result.rows[0]) : null;
}

export async function setDepositFulfillment(userId: string, code: string, method: FulfillmentMethod, pickup: PickupDetails | null) {
  const result = await db().query(
    `UPDATE deposits d SET status = 'waiting', fulfillment_method = $3, pickup_address = $4, pickup_phone = $5
     WHERE d.owner_id = $1 AND d.code = $2 AND d.status = 'approved'
       AND EXISTS (SELECT 1 FROM collection_points p WHERE p.slug = d.point_slug AND p.active)`,
    [userId, code, method, pickup?.address ?? null, pickup?.phone ?? null],
  );
  return result.rowCount === 1;
}

export async function reviewAssignedDeposit(reviewerId: string, code: string, reason: ReviewReason | null, isAdmin: boolean) {
  const result = await db().query<DepositRow>(
    `WITH d AS (
       UPDATE deposits SET status = $3, reason = $4, reviewer_id = $1, reviewed_at = now(),
         pickup_address = NULL, pickup_phone = NULL
       WHERE code = $2 AND status = 'waiting' AND EXISTS (
         SELECT 1 FROM collection_points p WHERE p.slug = deposits.point_slug AND p.active AND ($5::boolean OR EXISTS (
           SELECT 1 FROM reviewer_assignments a WHERE a.user_id = $1 AND a.point_slug = p.slug
         ))
       )
       RETURNING *
     )
     SELECT ${depositColumns} FROM d JOIN collection_points p ON p.slug = d.point_slug`,
    [reviewerId, code, reason ? "adjustment" : "accepted", reason, isAdmin],
  );
  return result.rows[0] ? fromRow(result.rows[0]) : null;
}
