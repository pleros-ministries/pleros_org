// Removes only the seeded teaching posts (and any old "[DEMO]" posts) from
// the community feed, with their comments, reactions, flags and
// notifications. Real members' posts are left alone.
// Run: node --env-file=.env scripts/_wipe-community-demo.mjs
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

const rows = await sql`
  select id from community_posts
  where title like '[DEMO]%'
     or images::text like '%feed-lesson-%'
     or shared_from_post_id in (
       select id from community_posts
       where title like '[DEMO]%' or images::text like '%feed-lesson-%'
     )`;
const ids = rows.map((row) => row.id);

if (ids.length > 0) {
  const commentIds = (
    await sql`select id from community_post_comments where post_id = any(${ids})`
  ).map((row) => row.id);
  await sql`
    delete from content_flags
    where (target_type = 'post' and target_id = any(${ids}))
       or (target_type = 'comment' and target_id = any(${commentIds}))`;
  await sql`delete from community_notifications where (payload->>'postId')::int = any(${ids})`;
  await sql`delete from community_posts where id = any(${ids}) and shared_from_post_id is not null`;
  await sql`delete from community_posts where id = any(${ids})`; // comments + reactions cascade
}

console.log(`Removed ${ids.length} demo post(s).`);
