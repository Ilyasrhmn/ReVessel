import { readdir, readFile } from "node:fs/promises";
import pg from "pg";

const [command, ...args] = process.argv.slice(2);
const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("Set DATABASE_URL before running this command.");

const client = new pg.Client({ connectionString, connectionTimeoutMillis: 5_000 });
await client.connect();
try {
  await client.query("BEGIN");
  if (command === "migrate") {
    await client.query("SELECT pg_advisory_xact_lock(4171532)");
    await client.query(`CREATE TABLE IF NOT EXISTS revessel_migrations (
      name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now()
    )`);
    const { rows } = await client.query("SELECT name FROM revessel_migrations");
    const applied = new Set(rows.map(({ name }) => name));
    const directory = new URL("../migrations/", import.meta.url);
    for (const name of (await readdir(directory)).filter((file) => file.endsWith(".sql")).sort()) {
      if (applied.has(name)) continue;
      await client.query(await readFile(new URL(name, directory), "utf8"));
      await client.query("INSERT INTO revessel_migrations (name) VALUES ($1)", [name]);
      console.log(`Applied ${name}`);
    }
  } else if (command === "point") {
    const [slug, name, address, ...materials] = args;
    if (!slug || !name?.trim() || !address?.trim() || !materials.length) {
      throw new Error('Usage: npm run db:point -- <slug> "<name>" "<address>" "<material>" ...');
    }
    await client.query(
      `INSERT INTO collection_points (slug, name, address, materials) VALUES ($1, $2, $3, $4)
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, materials = EXCLUDED.materials, active = true`,
      [slug, name.trim(), address.trim(), [...new Set(materials)]],
    );
    console.log("Collection point saved.");
  } else if (command === "assign-reviewer") {
    const [email, point] = args;
    if (!email || !point) throw new Error("Usage: npm run db:reviewer -- <registered-email> <point-slug>");
    const user = await client.query(
      `UPDATE "user" SET role = 'reviewer'
       WHERE email = $1 AND role IN ('resident', 'reviewer')
         AND EXISTS (SELECT 1 FROM collection_points WHERE slug = $2 AND active)
       RETURNING id`, [email.trim().toLowerCase(), point],
    );
    if (!user.rows[0]) throw new Error("Account or active collection point not found.");
    await client.query(
      "INSERT INTO reviewer_assignments (user_id, point_slug) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [user.rows[0].id, point],
    );
    console.log("Reviewer assigned to the collection point.");
  } else if (command === "assign-admin") {
    const [email] = args;
    if (!email) throw new Error("Usage: npm run db:admin -- <registered-admin-email>");
    const result = await client.query(
      `UPDATE "user" u SET role = 'admin'
       WHERE u.email = $1
         AND NOT EXISTS (SELECT 1 FROM deposits d WHERE d.owner_id = u.id)
         AND NOT EXISTS (SELECT 1 FROM reward_redemptions rr WHERE rr.owner_id = u.id)`,
      [email.trim().toLowerCase()],
    );
    if (result.rowCount !== 1) throw new Error("Use a dedicated registered account without deposits or reward redemptions.");
    console.log("Admin access assigned.");
  } else {
    throw new Error("Choose migrate, point, assign-reviewer, or assign-admin.");
  }
  await client.query("COMMIT");
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  await client.end();
}
