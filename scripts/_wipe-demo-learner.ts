// Removes the demo learner from scripts/_seed-demo-learner.ts and every row
// that points at it, however deep (enrolment, default group, path choice,
// plan, progress, sessions). It follows the database's own foreign keys,
// collects the rows first, then deletes children before parents in one
// transaction, so nothing else is touched and a failure changes nothing.
// Run: npx tsx --env-file=.env scripts/_wipe-demo-learner.ts [--dry-run]
import fs from "node:fs";
import path from "node:path";
import { neon } from "@neondatabase/serverless";

const DEMO_LEARNER_EMAIL = "demo.learner@pleros.test";
const sql = neon(process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL!);
const dryRun = process.argv.includes("--dry-run");
const ident = (name: string) => `"${name.replace(/"/g, '""')}"`;

type Fk = { child: string; childCol: string; parent: string; parentCol: string };

async function main() {
  const [demo] = await sql`select id from "user" where lower(email) = ${DEMO_LEARNER_EMAIL}`;
  if (!demo) { console.log("No demo learner found; nothing to remove."); return; }

  const fks = (await sql`
    select kcu.table_name as child, kcu.column_name as "childCol",
           ccu.table_name as parent, ccu.column_name as "parentCol"
    from information_schema.table_constraints tc
    join information_schema.key_column_usage kcu on kcu.constraint_name = tc.constraint_name and kcu.table_schema = tc.table_schema
    join information_schema.constraint_column_usage ccu on ccu.constraint_name = tc.constraint_name and ccu.table_schema = tc.table_schema
    where tc.constraint_type = 'FOREIGN KEY' and tc.table_schema = 'public'`) as Fk[];

  // Each table's demo rows are described by "column = any(values)" predicates, so tables without an id work too.
  const preds = new Map<string, Map<string, Set<string>>>();
  const queue: { table: string; col: string; values: string[] }[] = [];
  const claim = (table: string, col: string, values: string[]) => {
    const byCol = preds.get(table) ?? new Map<string, Set<string>>();
    preds.set(table, byCol);
    const set = byCol.get(col) ?? new Set<string>();
    byCol.set(col, set);
    const fresh = values.filter(v => v != null && !set.has(v));
    fresh.forEach(v => set.add(v));
    return fresh;
  };
  // Two roots: the sign-in account ("user") and the app's own record ("users"), which share the id.
  claim("user", "id", [demo.id]);
  queue.push({ table: "user", col: "id", values: [demo.id] });
  const [appUser] = await sql`select id from users where id = ${demo.id}`;
  if (appUser) { claim("users", "id", [demo.id]); queue.push({ table: "users", col: "id", values: [demo.id] }); }

  while (queue.length) {
    const { table, col, values } = queue.shift()!;
    // Rows of `table` matched by col=values may be parents through any referenced column.
    const parentCols = [...new Set(fks.filter(f => f.parent === table).map(f => f.parentCol))];
    for (const pc of parentCols) {
      const keyVals = pc === col ? values : (await sql.query(`select ${ident(pc)}::text as v from ${ident(table)} where ${ident(col)}::text = any($1)`, [values]) as { v: string | null }[]).map(r => r.v!).filter(Boolean);
      if (!keyVals.length) continue;
      for (const fk of fks.filter(f => f.parent === table && f.parentCol === pc)) {
        const rows = await sql.query(`select ${ident(fk.childCol)}::text as v from ${ident(fk.child)} where ${ident(fk.childCol)}::text = any($1)`, [keyVals]) as { v: string }[];
        const fresh = claim(fk.child, fk.childCol, [...new Set(rows.map(r => r.v))]);
        if (fresh.length) queue.push({ table: fk.child, col: fk.childCol, values: fresh });
      }
    }
  }

  // Children before parents: a table goes once no other involved table still points at it.
  const involved = [...preds.keys()];
  const remaining = new Set(involved);
  const order: string[] = [];
  while (remaining.size) {
    const ready = [...remaining].filter(t => !fks.some(f => f.parent === t && f.child !== t && remaining.has(f.child)));
    const next = ready.length ? ready : [remaining.values().next().value as string];
    next.forEach(t => { order.push(t); remaining.delete(t); });
  }

  const statements = order.map(t => {
    const parts = [...preds.get(t)!].filter(([, v]) => v.size);
    const where = parts.map(([c], i) => `${ident(c)}::text = any($${i + 1})`).join(" or ");
    return parts.length ? { table: t, text: `delete from ${ident(t)} where ${where}`, params: parts.map(([, v]) => [...v]) } : null;
  }).filter(s => s !== null);
  const counts = await Promise.all(statements.map(async s => {
    const [row] = await sql.query(s.text.replace(/^delete from/, "select count(*)::int as n from"), s.params) as { n: number }[];
    return `${s.table}: ${row.n}`;
  }));
  console.log(`${dryRun ? "Would remove" : "Removing"}:\n  ${counts.join("\n  ")}`);
  if (dryRun) return;
  await sql.transaction(statements.map(s => sql.query(s.text, s.params)));
  fs.rmSync(path.join(process.cwd(), "tmp", "demo-learner.txt"), { force: true });
  console.log("Demo learner removed.");
}

main().then(() => process.exit(0), (error) => { console.error(error); process.exit(1); });
