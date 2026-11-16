import "server-only";
import { randomBytes } from "node:crypto";
import { db } from "./db";

type Reward = { id: string; name: string; pickup: string; cost: number; stock: number };
type Redemption = { code: string; name: string; pickup: string; cost: number; fulfilled: boolean };
type Transaction = { code: string; points: number; description: string; date: string };

export async function readRewards() {
  const { rows } = await db().query<Reward>(
    "SELECT id, name, pickup, cost, stock FROM rewards ORDER BY (stock > 0) DESC, created_at DESC",
  );
  return rows;
}

const totalPoints = "SELECT COALESCE(SUM(points), 0)::integer AS balance FROM point_transactions WHERE owner_id = $1";

export async function readResidentRewards(userId: string) {
  const pool = db();
  const [rewards, summary] = await Promise.all([
    readRewards(),
    pool.query<{ balance: number; activity: Transaction[]; redemptions: Redemption[] }>(
      `SELECT (${totalPoints}) AS balance,
        COALESCE((
          SELECT json_agg(activity) FROM (
            SELECT code, points, description, occurred_at AS date
            FROM point_transactions WHERE owner_id = $1
            ORDER BY occurred_at DESC NULLS LAST, code LIMIT 25
          ) activity
        ), '[]'::json) AS activity,
        COALESCE((
          SELECT json_agg(claim) FROM (
            SELECT rr.code, r.name, r.pickup, rr.cost, (rr.fulfilled_at IS NOT NULL) AS fulfilled
            FROM reward_redemptions rr JOIN rewards r ON r.id = rr.reward_id
            WHERE rr.owner_id = $1
            ORDER BY (rr.fulfilled_at IS NOT NULL), rr.created_at DESC LIMIT 25
          ) claim
        ), '[]'::json) AS redemptions`, [userId],
    ),
  ]);
  return { rewards, ...summary.rows[0] };
}

export async function redeemResidentReward(userId: string, rewardId: string, requestId: string) {
  const client = await db().connect();
  let committed = false;
  try {
    await client.query("BEGIN");
    // Serialize spending from the same balance before locking shared stock.
    const viewer = await client.query('SELECT id FROM "user" WHERE id = $1 AND role = $2 FOR UPDATE', [userId, "resident"]);
    if (!viewer.rowCount) return { error: "Akun tidak dapat menukarkan poin." };

    const prior = await client.query<{ code: string; rewardId: string }>(
      'SELECT code, reward_id AS "rewardId" FROM reward_redemptions WHERE owner_id = $1 AND request_id = $2',
      [userId, requestId],
    );
    if (prior.rows[0]) {
      return prior.rows[0].rewardId === rewardId
        ? { code: prior.rows[0].code }
        : { error: "Permintaan ini sudah dipakai untuk reward lain." };
    }

    const { rows: [reward] } = await client.query<Pick<Reward, "cost" | "stock">>(
      "SELECT cost, stock FROM rewards WHERE id = $1 FOR UPDATE", [rewardId],
    );
    if (!reward?.stock) return { error: "Stok reward habis." };

    const { rows: [account] } = await client.query<{ balance: number }>(totalPoints, [userId]);
    if (account.balance < reward.cost) return { error: "Poinmu belum cukup untuk reward ini." };

    const code = `RW-${randomBytes(6).toString("hex").toUpperCase()}`;
    await client.query("UPDATE rewards SET stock = stock - 1 WHERE id = $1", [rewardId]);
    await client.query(
      "INSERT INTO reward_redemptions (code, owner_id, reward_id, request_id, cost) VALUES ($1, $2, $3, $4, $5)",
      [code, userId, rewardId, requestId, reward.cost],
    );
    await client.query("COMMIT");
    committed = true;
    return { code };
  } finally {
    const rollbackError = committed ? undefined : await client.query("ROLLBACK").then(() => undefined, () => true);
    client.release(rollbackError);
  }
}

export async function publishReward(reward: Reward) {
  await db().query(
    "INSERT INTO rewards (id, name, pickup, cost, stock) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING",
    [reward.id, reward.name, reward.pickup, reward.cost, reward.stock],
  );
}

export async function fulfillReward(code: string) {
  const result = await db().query<{ fulfilled: boolean }>(
    `UPDATE reward_redemptions SET fulfilled_at = COALESCE(fulfilled_at, now())
     WHERE code = $1 RETURNING (fulfilled_at IS NOT NULL) AS fulfilled`, [code],
  );
  return Boolean(result.rows[0]?.fulfilled);
}

export async function readPendingRedemptions() {
  const { rows } = await db().query<{ code: string; name: string; cost: number }>(
    `SELECT rr.code, r.name, rr.cost
     FROM reward_redemptions rr JOIN rewards r ON r.id = rr.reward_id
     WHERE rr.fulfilled_at IS NULL ORDER BY rr.created_at, rr.code LIMIT 25`,
  );
  return rows;
}
