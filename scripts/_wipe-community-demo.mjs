// Throwaway: removes ALL community content (demo only — nothing real exists yet)
// and undoes any demo unit leader. Leaves units / unit_members intact.
// Run: node --env-file=.env scripts/_wipe-community-demo.mjs
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

const TABLES = [
  "community_notifications",
  "content_flags",
  "comment_reactions",
  "community_post_comments",
  "post_reactions",
  "community_posts",
];

async function counts(label) {
  const out = {};
  for (const t of TABLES) out[t] = (await sql.query(`select count(*)::int n from ${t}`))[0].n;
  out["unit_members(leader)"] = (
    await sql`select count(*)::int n from unit_members where role = 'leader'`
  )[0].n;
  console.log(label, out);
}

await counts("before:");

await sql`delete from community_notifications`;
await sql`delete from content_flags`;
await sql`delete from community_posts`; // comments + reactions cascade
await sql`update unit_members set role = 'member' where role = 'leader'`;

await counts("after: ");
console.log("\nunits / unit_members are untouched (they derive from real enrolments).");
