/** Explicit reviewed 0054→0055 tail only. Never invoked by build/deploy hooks. */
import fs from "node:fs";
import crypto from "node:crypto";
import dotenv from "dotenv";
import { neon,Pool } from "@neondatabase/serverless";
const applying = process.argv.includes("--apply");
const paths = process.argv.flatMap((value,index,args) => value === "--env-file" && args[index + 1] ? [args[index + 1]] : []);
if (!paths.length) throw new Error("Pass explicit --env-file paths in increasing precedence order.");
const env = Object.assign({},...paths.map(path => dotenv.parse(fs.readFileSync(path))));
const url = env.DATABASE_URL_UNPOOLED ?? env.DATABASE_URL;
if (!url) throw new Error("The explicit environment has no database connection.");
const target = new URL(url);
const fingerprint = crypto.createHash("sha256").update(target.hostname.replace("-pooler","") + target.pathname).digest("hex");
if (applying && (process.env.PLEROS_APPROVED_SOGP_MIGRATIONS !== "0054,0055" || process.env.PLEROS_ROLLOUT_ENDPOINT_SHA256 !== fingerprint)) throw new Error("Apply requires approval of exactly 0054,0055 and the verified endpoint fingerprint.");
const journal = JSON.parse(fs.readFileSync("drizzle/meta/_journal.json","utf8")).entries;
const files = ["drizzle/0054_reporting_v3.sql","drizzle/0055_sogp_learning_v3.sql"];
const migrations = files.map(path => {
  const entry = journal.find(item => `drizzle/${item.tag}.sql` === path);
  if (!entry) throw new Error("A requested journal entry is missing.");
  const contents = fs.readFileSync(path,"utf8");
  return { path,contents,when:entry.when,hash:crypto.createHash("sha256").update(contents).digest("hex") };
});
const required = ["church_meeting_reports","church_shared_meetings","ministry_report_contacts","ministry_report_entries","private_ministry_contacts","sogp_episode_playback","sogp_learning_plan_items","sogp_learning_preferences"];
const read = neon(url);
const present = await read`select table_name from information_schema.tables where table_schema='public' and table_name=any(${required})`;
const ledger = await read`select hash,created_at from drizzle.__drizzle_migrations order by created_at desc limit 1`;
console.log(JSON.stringify({mode:applying?"apply":"dry-run",endpointFingerprint:fingerprint,existingObjects:present.map(row=>row.table_name),ledgerTail:ledger[0]??null,migrations:migrations.map(({path,when,hash})=>({path,when,hash})),activation:"separate; unchanged"},null,2));
if (!applying) process.exit(0);
if (present.length || Number(ledger[0]?.created_at ?? 0) >= migrations[0].when) throw new Error("Objects or journal are ahead/partial. Refuse blind replay.");
const previous = journal.find(item=>item.tag==="0053_church_multi_branch_pastors");
if (!previous || Number(ledger[0]?.created_at) !== previous.when) throw new Error("The ledger is not at the verified 0053 predecessor.");
const previousHash = crypto.createHash("sha256").update(fs.readFileSync("drizzle/0053_church_multi_branch_pastors.sql")).digest("hex");
if (ledger[0]?.hash !== previousHash) throw new Error("The predecessor journal hash does not match the reviewed source.");
const oldTables = ["users","sogp_enrollments","student_progress","podcast_journeys","podcast_episode_progress"];
// Digests stay inside the process: no learner rows or identity-bearing values
// leave the database. Include every column to detect any accidental DML.
const snapshotSql = oldTables.map(table=>`select '${table}' as name,count(*)::text as count,md5(coalesce(string_agg(md5(row_to_json(t)::text),',' order by md5(row_to_json(t)::text)),'')) as digest from public."${table}" t`).join(" union all ") + " order by name";
const pool = new Pool({connectionString:url});
const client = await pool.connect();
try {
  await client.query("BEGIN ISOLATION LEVEL REPEATABLE READ");
  await client.query("SET LOCAL lock_timeout = '5s'");
  await client.query("SET LOCAL statement_timeout = '60s'");
  await client.query("select pg_advisory_xact_lock(hashtextextended('pleros:dashboard-migration-tail',0))");
  const fresh = await client.query("select hash,created_at from drizzle.__drizzle_migrations order by created_at desc limit 1");
  if (fresh.rows[0]?.hash !== ledger[0]?.hash || Number(fresh.rows[0]?.created_at) !== previous.when) throw new Error("The journal changed after preflight.");
  const before = (await client.query(snapshotSql)).rows;
  for (const migration of migrations) {
    await client.query(migration.contents);
    await client.query("insert into drizzle.__drizzle_migrations(hash,created_at) values($1,$2)",[migration.hash,migration.when]);
  }
  const after = (await client.query(snapshotSql)).rows;
  if (JSON.stringify(before) !== JSON.stringify(after)) throw new Error("Legacy records changed inside the migration transaction.");
  const objects = await client.query("select table_name from information_schema.tables where table_schema='public' and table_name=any($1)",[required]);
  if (objects.rows.length !== required.length) throw new Error("A requested table is missing after application.");
  const invalid = await client.query("select c.conname from pg_constraint c join pg_class t on t.oid=c.conrelid where t.relname=any($1) and not c.convalidated",[required]);
  if (invalid.rows.length) throw new Error("An added constraint was not validated.");
  await client.query("COMMIT");
  console.log(JSON.stringify({applied:files,legacyRecordsUnchanged:true,legacyCounts:before.map(({name,count})=>({name,count})),tablesVerified:objects.rows.length,activation:"still unchanged"},null,2));
} catch(error) {
  await client.query("ROLLBACK").catch(()=>undefined);
  console.error(JSON.stringify({migrationAborted:true,code:error.code??error.name,activation:"unchanged"}));
  process.exitCode=1;
} finally {client.release();await pool.end();}
