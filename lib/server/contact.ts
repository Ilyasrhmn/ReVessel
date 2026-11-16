import "server-only";
import { db } from "./db";

export async function saveContactMessage(id: string, name: string, email: string, body: string) {
  const { rowCount } = await db().query(
    `INSERT INTO contact_messages (id, sender_name, sender_email, body)
     SELECT $1, $2, $3, $4
     WHERE (SELECT count(*) FROM contact_messages WHERE sender_email = $3 AND sent_at > now() - interval '1 hour') < 5
     ON CONFLICT (id) DO NOTHING`, [id, name, email, body],
  );
  if (rowCount) return true;
  const existing = await db().query(
    "SELECT 1 FROM contact_messages WHERE id = $1 AND sender_email = $2", [id, email],
  );
  return Boolean(existing.rowCount);
}

export async function readContactMessages() {
  const { rows } = await db().query<{ id: string; name: string; email: string; body: string; sentAt: Date }>(
    `SELECT id, sender_name AS name, sender_email AS email, body, sent_at AS "sentAt"
     FROM contact_messages ORDER BY sent_at DESC LIMIT 25`,
  );
  return rows;
}
