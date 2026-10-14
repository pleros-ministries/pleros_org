/** Explicit additive 0056, or --group-reviews for 0057, on the confirmed target. */
import fs from "node:fs";
import crypto from "node:crypto";
import dotenv from "dotenv";
import { Pool } from "@neondatabase/serverless";

const paths = process.argv.flatMap((arg, index, args) => arg === "--env-file" && args[index + 1] ? [args[index + 1]] : []);
if (!paths.length) throw new Error("Pass explicit --env-file paths.");
const env = Object.assign({}, ...paths.map(path => dotenv.parse(fs.readFileSync(path))));
const url = env.DATABASE_URL_UNPOOLED ?? env.DATABASE_URL;
if (!url) throw new Error("Database connection is missing.");
const target = new URL(url);
const fingerprint = crypto.createHash("sha256").update(target.hostname.replace("-pooler", "") + target.pathname).digest("hex");
const approved = "d3d229e68f00b0a26fb78f2dd4081adae7f4ffcf5d6a920c03329c525dfc88c1";
if (fingerprint !== approved) throw new Error("This is not the previously confirmed shared target.");
const journal = JSON.parse(fs.readFileSync("drizzle/meta/_journal.json", "utf8")).entries;
const migrationNumber = process.argv.includes("--group-reviews") ? 57 : 56;
const previous = journal.find(row => row.idx === migrationNumber - 1);
const current = journal.find(row => row.idx === migrationNumber);
const contents = fs.readFileSync(`drizzle/${current.tag}.sql`, "utf8");
const hash = text => crypto.createHash("sha256").update(text).digest("hex");
const previousHash = hash(fs.readFileSync(`drizzle/${previous.tag}.sql`, "utf8"));
const applying = process.argv.includes("--apply");
const pool = new Pool({ connectionString: url });
const client = await pool.connect();
try {
  const tail = (await client.query("select hash,created_at from drizzle.__drizzle_migrations order by created_at desc limit 1")).rows[0];
  const tables = migrationNumber === 57 ? ["sogp_group_reviews", "sogp_group_review_attendance"] : ["sogp_follow_up_requests"];
  const present = (await client.query("select table_name from information_schema.tables where table_schema='public' and table_name=any($1)", [tables])).rows;
  console.log(JSON.stringify({ mode: applying ? "apply" : "dry-run", endpointFingerprint: fingerprint, migration: current.tag, predecessorMatches: tail?.hash === previousHash && Number(tail?.created_at) === previous.when, existingTables: present.map(row => row.table_name) }));
  if (!applying) process.exitCode = 0;
  else {
    if (present.length || tail?.hash !== previousHash || Number(tail?.created_at) !== previous.when) throw new Error("Refusing partial/replayed migration or an unexpected predecessor.");
    await client.query("BEGIN ISOLATION LEVEL REPEATABLE READ");
    await client.query("SET LOCAL lock_timeout = '5s'");
    await client.query("SET LOCAL statement_timeout = '60s'");
    await client.query("select pg_advisory_xact_lock(hashtextextended('pleros:dashboard-migration-tail',0))");
    const fresh = (await client.query("select hash,created_at from drizzle.__drizzle_migrations order by created_at desc limit 1")).rows[0];
    if (fresh?.hash !== previousHash || Number(fresh?.created_at) !== previous.when) throw new Error("Journal changed after preflight.");
    const preserved = ["users", "sogp_enrollments", "pastor_assignments", "student_progress", "podcast_episode_progress", "discipleship_memberships", "sogp_live_classes", "sogp_live_class_attendance", "sogp_certificates", ...(migrationNumber === 57 ? ["sogp_follow_up_requests"] : [])];
    const snapshotSql = preserved.map(table => `select '${table}' as name,count(*)::text as count,md5(coalesce(string_agg(md5(row_to_json(t)::text),',' order by md5(row_to_json(t)::text)),'')) as digest from public."${table}" t`).join(" union all ") + " order by name";
    const before = (await client.query(snapshotSql)).rows;
    await client.query(contents);
    await client.query("insert into drizzle.__drizzle_migrations(hash,created_at) values($1,$2)", [hash(contents), current.when]);
    const after = (await client.query(snapshotSql)).rows;
    if (JSON.stringify(before) !== JSON.stringify(after)) throw new Error("Existing records changed inside this migration.");
    for (const table of tables) {
      const count = (await client.query(`select count(*)::int as n from public."${table}"`)).rows[0].n;
      if (count !== 0) throw new Error("The migration unexpectedly populated a new table.");
    }
    await client.query("COMMIT");
    console.log(JSON.stringify({ applied: current.tag, existingRecordsUnchanged: true, newTablesEmpty: tables }));
  }
} catch (error) {
  await client.query("ROLLBACK").catch(() => undefined);
  console.error(JSON.stringify({ aborted: true, code: error.code ?? error.name, message: error.code ? "Database operation failed; transaction rolled back." : error.message }));
  process.exitCode = 1;
} finally { client.release(); await pool.end(); }
