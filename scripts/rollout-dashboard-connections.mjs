/** Explicit, opt-in migration tail. Never run from build/install/deploy hooks. */
import fs from "node:fs";
import crypto from "node:crypto";
import dotenv from "dotenv";
import { neon, Pool } from "@neondatabase/serverless";

const apply = process.argv.includes("--apply");
const multiBranch = process.argv.includes("--multi-branch");
const approvedTail = multiBranch ? "0053" : "0050-0052";
const envIndex = process.argv.indexOf("--env-file");
if (envIndex < 0 || !process.argv[envIndex + 1]) throw new Error("Pass an explicit environment file; no default database is used.");
const environment = dotenv.parse(fs.readFileSync(process.argv[envIndex + 1]));
const url = environment.DATABASE_URL_UNPOOLED ?? environment.DATABASE_URL;
if (!url) throw new Error("The chosen environment has no database connection.");
const expectedEndpoint = process.env.PLEROS_ROLLOUT_ENDPOINT_SHA256;
const endpoint = new URL(url); const fingerprint = crypto.createHash("sha256").update(endpoint.hostname.replace("-pooler", "") + endpoint.pathname).digest("hex");
if (apply && (process.env.PLEROS_APPROVED_DASHBOARD_MIGRATIONS !== approvedTail || expectedEndpoint !== fingerprint)) throw new Error("Applying requires explicit approval and the exact endpoint fingerprint from the dry run.");

const baseTables = ["daily_report_declarations", "daily_report_meeting_details", "church_branches", "church_units", "church_assignments", "daily_report_preferences"];
const required = multiBranch ? ["church_branch_pastors"] : baseTables;
const files = multiBranch ? ["drizzle/0053_church_multi_branch_pastors.sql"] : ["drizzle/0050_daily_reporting_v2.sql", "drizzle/0051_church_organisation_v2.sql", "drizzle/0052_daily_report_push_preferences.sql"];
const read = neon(url);
const present = await read`select table_name from information_schema.tables where table_schema='public' and table_name = any(${required})`;
const kinds = await read`select e.enumlabel from pg_enum e join pg_type t on t.oid=e.enumtypid where t.typname='community_notification_kind' and e.enumlabel in ('discipleship_joined','daily_report_reminder')`;
const plan = { mode: apply ? "apply" : "dry-run", endpointFingerprint: fingerprint, existingTables: present.map(row => row.table_name), notificationKindExists: kinds.some(row => row.enumlabel === "daily_report_reminder"), migrations: files.map(path => ({ path, sha256: crypto.createHash("sha256").update(fs.readFileSync(path)).digest("hex") })) };
console.log(JSON.stringify(plan, null, 2));
if (!apply) process.exit(0);
if (present.length || (!multiBranch && plan.notificationKindExists)) throw new Error("Objects already exist: review partial/application history instead of blindly replaying migrations.");
if (multiBranch) {
  const prerequisites = await read`select table_name from information_schema.tables where table_schema='public' and table_name = any(${baseTables})`;
  if (prerequisites.length !== baseTables.length) throw new Error("Apply and verify the approved reporting/church tail before multi-branch support.");
}
if (!kinds.some(row => row.enumlabel === "discipleship_joined")) throw new Error("The notification enum prerequisite is missing.");
const pool = new Pool({ connectionString: url });
const client = await pool.connect();
try {
  await client.query("BEGIN");
  await client.query("SET LOCAL lock_timeout = '10s'");
  await client.query("SET LOCAL statement_timeout = '60s'");
  await client.query("select pg_advisory_xact_lock(hashtextextended('pleros:dashboard-migration-tail',0))");
  const journal = JSON.parse(fs.readFileSync("drizzle/meta/_journal.json", "utf8"));
  const entries = files.map(path => journal.entries.find(entry => `drizzle/${entry.tag}.sql` === path));
  if (entries.some(entry => !entry)) throw new Error("The migration journal is missing a requested entry.");
  const ledger = await client.query("select created_at from drizzle.__drizzle_migrations order by created_at desc limit 1");
  if (ledger.rows[0] && Number(ledger.rows[0].created_at) >= entries[0].when) throw new Error("Migration ledger is ahead of this tail; investigate rather than replay.");
  for (let index = 0; index < files.length; index++) {
    const path = files[index]; const contents = fs.readFileSync(path, "utf8");
    await client.query(contents);
    await client.query("insert into drizzle.__drizzle_migrations (hash,created_at) values ($1,$2)", [crypto.createHash("sha256").update(contents).digest("hex"), entries[index].when]);
  }
  await client.query("COMMIT");
  const rows = await read`select table_name from information_schema.tables where table_schema='public' and table_name = any(${required})`;
  if (rows.length !== required.length) throw new Error("Migration committed but post-check is incomplete; leave activation disabled.");
  console.log(JSON.stringify({ applied: files, tablesVerified: rows.length, activation: "still disabled" }));
} catch (error) {
  await client.query("ROLLBACK").catch(() => undefined);
  console.error("Migration aborted; activation stays disabled.", error.code ?? error.name);
  process.exitCode = 1;
} finally { client.release(); await pool.end(); }
