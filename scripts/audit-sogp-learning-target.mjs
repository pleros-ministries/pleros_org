/** Read-only release preflight. Never prints connection strings or learner rows. */
import fs from "node:fs";
import crypto from "node:crypto";
import dotenv from "dotenv";
import { neon } from "@neondatabase/serverless";

const paths = process.argv.flatMap((value,index,args) => value === "--env-file" && args[index + 1] ? [args[index + 1]] : []);
if (!paths.length) throw new Error("Pass explicit --env-file paths in increasing precedence order.");
const env = Object.assign({},...paths.map(path => dotenv.parse(fs.readFileSync(path))));
const connection = env.DATABASE_URL_UNPOOLED ?? env.DATABASE_URL;
if (!connection) throw new Error("The explicit environment files have no database connection.");
const url = new URL(connection);
const endpointFingerprint = crypto.createHash("sha256").update(url.hostname.replace("-pooler","") + url.pathname).digest("hex");
const migration = fs.readFileSync("drizzle/0055_sogp_learning_v3.sql","utf8");
const entry = JSON.parse(fs.readFileSync("drizzle/meta/_journal.json","utf8")).entries.find(row => row.tag === "0055_sogp_learning_v3");
const read = neon(connection);
try {
  const metadata = await read`select current_database() as database,pg_is_in_recovery() as replica,to_regclass('drizzle.__drizzle_migrations')::text as ledger`;
  const tables = await read`select table_name from information_schema.tables where table_schema='public' and table_name in ('users','sogp_enrollments','student_progress','podcast_journeys','podcast_episode_progress','sogp_learning_preferences','sogp_learning_plan_items','sogp_episode_playback','daily_report_declarations','daily_report_meeting_details','church_branches','church_units','church_assignments','daily_report_preferences','church_branch_pastors','private_ministry_contacts','church_shared_meetings') order by table_name`;
  const ledger = metadata[0].ledger ? await read`select hash,created_at from drizzle.__drizzle_migrations order by created_at desc limit 8` : [];
  const canonicalReady = ["users","sogp_enrollments","student_progress","podcast_journeys","podcast_episode_progress"].every(name => tables.some(table => table.table_name === name));
  const canonicalCounts = canonicalReady ? await read`select (select count(*)::int from users) as users,(select count(*)::int from sogp_enrollments) as enrollments,(select count(*)::int from student_progress) as traditional_progress,(select count(*)::int from podcast_journeys) as journeys,(select count(*)::int from podcast_episode_progress) as listens` : null;
  const journal = JSON.parse(fs.readFileSync("drizzle/meta/_journal.json","utf8")).entries;
  console.log(JSON.stringify({ mode: "read-only",endpointFingerprint,metadata: metadata[0],tables: tables.map(row => row.table_name),canonicalCounts: canonicalCounts?.[0] ?? null,ledger: ledger.map(row => ({ ...row,localTag: journal.find(item => item.when === Number(row.created_at))?.tag ?? "not matched" })),requestedMigration: { tag: entry.tag,when: entry.when,sha256: crypto.createHash("sha256").update(migration).digest("hex") },learningFlags: { schema: env.DASHBOARD_SOGP_LEARNING_V3_SCHEMA ?? "unset",writes: env.DASHBOARD_SOGP_LEARNING_V3 ?? "unset" },deploymentTargetVerified: false },null,2));
} catch (error) {
  console.error(JSON.stringify({ mode: "read-only",auditFailed: true,code: error.code ?? error.name }));
  process.exitCode = 1;
}
