// Throwaway demo seed for the SOGP community feed. Not committed.
// Run:  node --env-file=.env scripts/_seed-community-demo.mjs
// Undo: node --env-file=.env scripts/_wipe-community-demo.mjs
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const KADUNA_UNIT_ID = 8;
const KADUNA_ENROLMENT = 33;

const img = (seed) => ({
  url: `https://picsum.photos/seed/${seed}/900/675`,
  key: `demo-${seed}`,
});

// ── resolve people ──────────────────────────────────────────────────────────
const adminEmail = (process.env.SUPER_ADMIN_EMAILS || "").split(",")[0]?.trim();
const [adminUser] = adminEmail
  ? await sql`select id from users where lower(email) = lower(${adminEmail}) limit 1`
  : [];
const [self] = await sql`
  select e.user_id, e.name, um.unit_id
  from sogp_enrollments e
  join unit_members um on um.enrollment_id = e.id
  where e.id = ${KADUNA_ENROLMENT} limit 1`;
if (!self) throw new Error("enrolment 33 has no unit membership — run the backfill first");

const adminId = adminUser?.id ?? self.user_id;
const unitId = self.unit_id ?? KADUNA_UNIT_ID;

// A pool of real members from the busy units to author feed content.
const authors = await sql`
  select um.enrollment_id, e.user_id, coalesce(nullif(e.first_name,''), e.name) as name
  from unit_members um
  join units u on u.id = um.unit_id
  join sogp_enrollments e on e.id = um.enrollment_id
  where u.name in ('Lagos, Nigeria','Osun, Nigeria','Ogun, Nigeria')
  order by um.enrollment_id
  limit 8`;
if (authors.length < 3) throw new Error("need at least 3 members in Lagos/Osun/Ogun units");
const pick = (i) => authors[i % authors.length];

// ── leader ──────────────────────────────────────────────────────────────────
await sql`update unit_members set role = 'member' where unit_id = ${unitId} and role = 'leader'`;
await sql`update unit_members set role = 'leader' where enrollment_id = ${KADUNA_ENROLMENT}`;

// ── posts ───────────────────────────────────────────────────────────────────
async function insertPost({
  scope = "global",
  unit = null,
  authorId,
  authorKind,
  title = null,
  body,
  images = [],
  pinned = false,
  sharedFrom = null,
}) {
  const [row] = await sql`
    insert into community_posts
      (scope, unit_id, author_id, author_kind, title, body, images, pinned, status, shared_from_post_id)
    values
      (${scope}, ${unit}, ${authorId}, ${authorKind}, ${title}, ${body},
       ${JSON.stringify(images)}::jsonb, ${pinned}, 'published', ${sharedFrom})
    returning id`;
  return row.id;
}

const welcomeId = await insertPost({
  authorId: adminId,
  authorKind: "ministry",
  title: "[DEMO] Welcome to the SOGP community",
  body: "This is the shared feed. Post an update, drop a photo, comment on each other's posts, and share what encourages you. Prayer Watch times and cohort news land here too.",
  images: [img("welcome-a"), img("welcome-b")],
  pinned: true,
});

const journalId = await insertPost({
  authorId: adminId,
  authorKind: "ministry",
  title: "[DEMO] Try journalling as you watch",
  body: "A simple rhythm that helps: watch the day's video, then write one or two lines on what stood out. Questions are welcome in the comments — ask away.",
  images: [img("journal-1")],
});

await insertPost({
  authorId: adminId,
  authorKind: "ministry",
  title: "[DEMO] Prayer Watch times this week",
  body: "Morning 5:30am · Afternoon 12:30pm · Evening 8:30pm (WAT). Join live or use the replay, then mark it complete on your dashboard.",
});

const unitPostId = await insertPost({
  scope: "unit",
  unit: unitId,
  authorId: self.user_id,
  authorKind: "leader",
  title: "[DEMO] Kaduna unit — introduce yourself",
  body: "Fellow Kaduna members: drop your name and one thing you're believing God for this cohort.",
  images: [img("kaduna-1"), img("kaduna-2"), img("kaduna-3")],
});

// one in-app repost (ministry reshares the journalling post to the community)
const repostId = await insertPost({
  authorId: adminId,
  authorKind: "ministry",
  body: "Worth a second look as we head into week two.",
  sharedFrom: journalId,
});
await sql`update community_posts set share_count = 1 where id = ${journalId}`;

// ── reactions ───────────────────────────────────────────────────────────────
let reactions = 0;
for (const [pi, postId] of [welcomeId, journalId, unitPostId, repostId].entries()) {
  for (let i = 0; i < 4; i++) {
    const u = pick(pi + i).user_id;
    const done = await sql`
      insert into post_reactions (post_id, user_id, kind) values (${postId}, ${u}, 'pray')
      on conflict do nothing returning id`;
    reactions += done.length;
  }
}

// ── comments + replies + comment likes ──────────────────────────────────────
async function comment(postId, authorId, body, replyToId = null) {
  const [row] = await sql`
    insert into community_post_comments (post_id, author_id, body, reply_to_id)
    values (${postId}, ${authorId}, ${body}, ${replyToId})
    returning id`;
  await sql`
    update community_posts
    set comment_count = comment_count + 1, last_activity_at = now()
    where id = ${postId}`;
  return row.id;
}

const c1 = await comment(journalId, pick(1).user_id, "Yes! I use a cheap notebook and just write one line per video. Keeps it sustainable.");
const c2 = await comment(journalId, pick(3).user_id, "Question: is it better to journal right after, or wait till the evening to reflect?");
await comment(journalId, pick(0).user_id, "Whatever you'll actually keep up — right after works for me.", c1);

const c3 = await comment(welcomeId, pick(2).user_id, "So glad this exists. Coming from the Lagos unit 👋");
await comment(welcomeId, pick(4).user_id, "Welcome!", c3);

const uc1 = await comment(unitPostId, pick(5)?.user_id ?? pick(0).user_id, "Hi all — Grace here, believing God for clarity on a career decision.");

let commentLikes = 0;
for (const cid of [c1, c2, c3, uc1]) {
  for (let i = 0; i < 2; i++) {
    const u = pick(cid + i).user_id;
    const done = await sql`
      insert into comment_reactions (comment_id, user_id, kind) values (${cid}, ${u}, 'like')
      on conflict do nothing returning id`;
    commentLikes += done.length;
  }
}

// ── one flagged comment for the moderation queue ────────────────────────────
await sql`
  insert into content_flags (target_type, target_id, reporter_id, reason, status)
  values ('comment', ${c2}, ${pick(4).user_id}, '[DEMO] test flag — please review', 'open')
  on conflict do nothing`;

// ── notifications for the admin/leader viewer ───────────────────────────────
await sql`
  insert into community_notifications (user_id, kind, payload) values
  (${adminId}, 'official_post', ${JSON.stringify({ postId: welcomeId, title: "[DEMO] Welcome to the SOGP community" })}::jsonb),
  (${adminId}, 'made_leader',   ${JSON.stringify({ unitName: "Kaduna, Nigeria" })}::jsonb),
  (${adminId}, 'post_comment',  ${JSON.stringify({ postId: welcomeId, title: "[DEMO] Welcome to the SOGP community" })}::jsonb)`;

console.log("Seeded demo community feed:");
console.log(`  leader: enrolment ${KADUNA_ENROLMENT} -> leader of unit ${unitId}`);
console.log(`  posts: 5 (ministry + 1 leader unit + 1 repost, 3 with images)  reactions: ${reactions}`);
console.log(`  member comments: 6  comment likes: ${commentLikes}  flags: 1  notifications: 3`);
console.log("\nWipe with: node --env-file=.env scripts/_wipe-community-demo.mjs");
