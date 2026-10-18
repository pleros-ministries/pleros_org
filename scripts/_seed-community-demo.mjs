// Demo seed for the SOGP community feed: five official posts drawn from the
// SOGP teachings, each with Codex-generated art under
// public/assets/community/feed/. Removes the old "[DEMO]" posts (and the
// repost of them) first, so it can be re-run safely.
// Run:  node --env-file=.env scripts/_seed-community-demo.mjs
// Undo: node --env-file=.env scripts/_wipe-community-demo.mjs
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

const img = (slug) => ({
  url: `/assets/community/feed/${slug}.webp`,
  key: `feed-lesson-${slug}`,
});

// ── author: the ministry account (the first super admin) ────────────────────
const adminEmail = (process.env.SUPER_ADMIN_EMAILS || "").split(",")[0]?.trim();
const [admin] = adminEmail
  ? await sql`select id from users where lower(email) = lower(${adminEmail}) limit 1`
  : await sql`select id from users where role = 'super_admin' order by created_at limit 1`;
if (!admin) throw new Error("no super-admin user found to author the posts");

// ── remove the previous demo posts ──────────────────────────────────────────
const old = await sql`
  select id from community_posts
  where title like '[DEMO]%'
     or images::text like '%feed-lesson-%'
     or shared_from_post_id in (
       select id from community_posts
       where title like '[DEMO]%' or images::text like '%feed-lesson-%'
     )`;
const oldIds = old.map((row) => row.id);
if (oldIds.length > 0) {
  const commentIds = (
    await sql`select id from community_post_comments where post_id = any(${oldIds})`
  ).map((row) => row.id);
  await sql`
    delete from content_flags
    where (target_type = 'post' and target_id = any(${oldIds}))
       or (target_type = 'comment' and target_id = any(${commentIds}))`;
  await sql`
    delete from community_notifications
    where (payload->>'postId')::int = any(${oldIds})`;
  // Reposts first, then the originals; comments and reactions cascade.
  await sql`delete from community_posts where id = any(${oldIds}) and shared_from_post_id is not null`;
  await sql`delete from community_posts where id = any(${oldIds})`;
}

const POSTS = [
  {
    slug: "purpose",
    daysAgo: 5,
    pinned: true,
    title: "Why you exist: God's purpose is sonship",
    body: `Why did God make the world, and why did He pay such a price to redeem it? That question can only be answered by revelation, and Ephesians 1:5 answers it: according to the good pleasure of His will, He brought us to adoption as sons.

God's purpose is sonship. He wants you in His family, relating with Him freely as His child, with boldness and liberty, not as a stranger waiting at the door.

From Foundation, lesson 2: God's Purpose, Why We Exist. Where do you still find it hard to call God "Father" with confidence?`,
  },
  {
    slug: "new-creation",
    daysAgo: 4,
    title: "The new creation is not a to-do list",
    body: `"If anyone is in Christ, he is a new creation" (2 Corinthians 5:17). What you received when you believed is the Spirit, so the new creation is not defined by human ability. It is divinity at work in humanity: your nature is His nature, and with it comes a new character.

Many people hear it as an instruction (try harder, stop this, stop that), and when they fail they wonder whether they were ever made new. Start from what is already true of you, then learn to walk in it.

From Foundation, lesson 3: The New Creation, Who You Are in Christ.`,
  },
  {
    slug: "faith-stand",
    daysAgo: 3,
    title: "Saved from something, made new for something",
    body: `Salvation is more than being pulled out of the way of danger. "Having believed, you were sealed with the Holy Spirit of promise" (Ephesians 1:13). You received the Spirit of adoption, by whom we cry, "Abba, Father."

Being made new means little until it shows in how you walk, and that walk grows by knowledge: "till we all come to the unity of the faith and of the knowledge of the Son of God" (Ephesians 4:13).

From Foundation, lesson 4: Faith Stand, How to Grow in Christ. What has helped you keep growing after the first excitement of believing?`,
  },
  {
    slug: "prayer",
    daysAgo: 2,
    title: "Prayer is a life, not an event",
    body: `We call it the believer's life of prayer to take prayer away from being one more activity in the day and see it as an ongoing reality of our life.

God's purpose is sonship, and sonship is child plus heir: you relate with Him as His child, and as His heir you take up the assignment He gives. That is why the life of purpose is the life of prayer.

From Level 3: The Life of Prayer. Prayer Watch is a good place to practise it. Which session will you keep this week?`,
  },
  {
    slug: "authority",
    daysAgo: 1,
    title: "Authority, and how a believer exercises it",
    body: `"Behold, I give you authority… over all the power of the enemy" (Luke 10:19). The word is exousia, the right for something to be, and it is set over dunamis, power. After His resurrection Jesus said all authority in heaven and on earth had been given to Him, and then: "Go therefore."

It is not enough to be right in conclusion; we need the explanation that makes the practice accurate. From Genesis 1 onward, man exercises authority by words.

From Level 3: Believer's Authority. How has this changed the way you speak over your situation?`,
  },
];

for (const post of POSTS) {
  const at = new Date(Date.now() - post.daysAgo * 24 * 60 * 60 * 1000);
  await sql`
    insert into community_posts
      (scope, author_id, author_kind, kind, topic, title, body, images, pinned, status,
       created_at, published_at, last_activity_at)
    values
      ('global', ${admin.id}, 'ministry', 'official', 'bible_study', ${post.title}, ${post.body},
       ${JSON.stringify([img(post.slug)])}::jsonb, ${post.pinned ?? false}, 'published',
       ${at}, ${at}, ${at})`;
}

console.log(`Removed ${oldIds.length} old demo post(s); seeded ${POSTS.length} teaching posts.`);
