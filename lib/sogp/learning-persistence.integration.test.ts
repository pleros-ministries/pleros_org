import { readFile } from "node:fs/promises";
import { sql } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type * as Schema from "@/lib/db/schema";

const runtime = vi.hoisted(() => ({ db: null as unknown as NodePgDatabase<typeof Schema>, pool: null as unknown as { end(): Promise<void> } }));
const identity = vi.hoisted(() => ({ userId: "a" as string | null }));
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));
vi.mock("@/lib/dashboard-action-session", () => ({ getDashboardActionSession: async () => identity.userId ? { user: { id: identity.userId, email: `${identity.userId}@example.test`, name: "Synthetic Learner", role: "student", image: null } } : null }));
vi.mock("@/lib/anchor-rss", () => ({ fetchAnchorEpisodes: async () => ["a", "b", "c", "d", "replacement"].map(guid => ({ guid, title: `Synthetic ${guid}`, link: "https://example.test", audioUrl: "https://example.test/audio.mp3", duration: "00:15:00", pubDate: "2026-01-01", isoDate: "2026-01-01", imageUrl: "", description: "", episodeNumber: null })) }));
vi.mock("@/lib/db", async () => {
  const root = process.env.PLEROS_LEARNING_REHEARSAL_ROOT;
  if (!root?.startsWith("/tmp/pleros-rehearsal.")) throw new Error("Use only the disposable learning rehearsal socket.");
  const pg = await import(/* @vite-ignore */ `${root}/runtime/node_modules/pg/lib/index.js`);
  const pool = new (pg.Pool ?? pg.default.Pool)({ host: `${root}/socket`, port: 55439, user: "pleros_test", database: "pleros_learning" });
  const { drizzle } = await import("drizzle-orm/node-postgres");
  runtime.pool = pool; runtime.db = drizzle(pool, { schema: await import("@/lib/db/schema") });
  return { db: runtime.db };
});
vi.mock("@/lib/db/transaction", () => ({ transactionDb: { transaction: (fn: Parameters<typeof runtime.db.transaction>[0]) => runtime.db.transaction(fn) } }));

describe.skipIf(!process.env.PLEROS_LEARNING_REHEARSAL_ROOT)("SOGP learning persistence, real PostgreSQL", () => {
  let learning: typeof import("@/lib/db/queries/sogp-learning");
  let legacy: typeof import("@/lib/db/queries/podcast-progress");
  const initial = { path: "podcast_two", expectedRevision: 0, episodeGuids: ["a", "b", "c", "d"] };
  beforeAll(async () => {
    learning = await import("@/lib/db/queries/sogp-learning");
    legacy = await import("@/lib/db/queries/podcast-progress");
    await runtime.db.execute(sql`
      create table users(id text primary key);
      create table sogp_enrollments(id serial primary key,user_id text references users(id),status text not null);
      create table podcast_episode_progress(id serial primary key,user_id text references users(id),episode_guid text not null,listened_at timestamptz not null default now(),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(user_id,episode_guid));
      create table podcast_journeys(user_id text primary key references users(id),track text not null,started_on date not null);
      create table student_progress(user_id text primary key references users(id),quiz_passed boolean not null,notes_read boolean not null);
      insert into users values('migration-existing');
      insert into podcast_journeys values('migration-existing','series:retained','2026-09-01');
      insert into podcast_episode_progress(user_id,episode_guid,listened_at) values('migration-existing','retained','2026-09-01T12:00:00Z');
      insert into student_progress values('migration-existing',true,true);
    `);
    await runtime.db.execute(sql.raw(await readFile("drizzle/0055_sogp_learning_v3.sql", "utf8")));
    expect((await runtime.db.execute(sql`select track,started_on::text from podcast_journeys where user_id='migration-existing'`)).rows).toEqual([{ track: "series:retained", started_on: "2026-09-01" }]);
    expect((await runtime.db.execute(sql`select episode_guid,to_char(listened_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"') as listened_at from podcast_episode_progress where user_id='migration-existing'`)).rows).toEqual([{ episode_guid: "retained", listened_at: "2026-09-01T12:00:00Z" }]);
    expect((await runtime.db.execute(sql`select quiz_passed,notes_read from student_progress where user_id='migration-existing'`)).rows).toEqual([{ quiz_passed: true, notes_read: true }]);
    expect((await runtime.db.execute(sql`select count(*)::int as n from sogp_learning_preferences`)).rows).toEqual([{ n: 0 }]);
  });
  beforeEach(async () => {
    vi.stubEnv("DASHBOARD_SOGP_LEARNING_V3_SCHEMA", "1"); vi.stubEnv("DASHBOARD_SOGP_LEARNING_V3", "1"); identity.userId = "a";
    await runtime.db.execute(sql`truncate users restart identity cascade;
      insert into users values('a'),('b'),('staff'),('withdrawn');
      insert into sogp_enrollments(user_id,status) values('a','enrolled'),('b','active'),('withdrawn','withdrawn');
      insert into podcast_journeys values('a','series:legacy','2026-09-01');
      insert into student_progress values('a',true,true);
      insert into podcast_episode_progress(user_id,episode_guid,listened_at) values('a','older','2026-09-01T12:00:00Z');
    `);
  });
  afterAll(async () => { vi.unstubAllEnvs(); await runtime.pool?.end(); });

  it("does not lazily create preferences or change an existing journey/history", async () => {
    expect(await learning.getOwnSogpLearning("a")).toMatchObject({ path: "traditional", revision: 0, plan: null });
    expect((await runtime.db.execute(sql`select count(*)::int as n from sogp_learning_preferences`)).rows[0]).toEqual({ n: 0 });
    expect((await runtime.db.execute(sql`select track,started_on::text from podcast_journeys where user_id='a'`)).rows[0]).toEqual({ track: "series:legacy", started_on: "2026-09-01" });
  });

  it("stores only the caller's plan and refuses unenrolled/withdrawn writes", async () => {
    const state = await learning.chooseOwnSogpPath("a", initial);
    expect(state).toMatchObject({ revision: 1, path: "podcast_two", plan: { episodeGuids: ["a", "b", "c", "d"] } });
    expect((await learning.getOwnSogpLearning("b"))?.plan).toBeNull();
    await expect(learning.chooseOwnSogpPath("staff", initial)).rejects.toThrow(/enrol/i);
    await expect(learning.chooseOwnSogpPath("withdrawn", initial)).rejects.toThrow(/enrol/i);
  });

  it("persists an explicit Traditional choice rather than treating it as a default read", async () => {
    const state = await learning.chooseOwnSogpPath("a", { path: "traditional", expectedRevision: 0 });
    expect(state).toMatchObject({ path: "traditional", revision: 1, plan: null });
    expect((await runtime.db.execute(sql`select count(*)::int as n from sogp_learning_preferences where user_id='a'`)).rows[0]).toEqual({ n: 1 });
  });

  it("retains an intentionally empty plan and its pace through Traditional switching", async () => {
    await learning.chooseOwnSogpPath("a", initial);
    await learning.editOwnSogpPlan("a", { expectedRevision: 1, episodeGuids: [] });
    const empty = { episodesPerDay: 2, episodeGuids: [], historyEpisodeGuids: [] };
    expect((await learning.getOwnSogpLearning("a"))?.plan).toEqual(empty);
    const traditional = await learning.chooseOwnSogpPath("a", { path: "traditional", expectedRevision: 2 });
    expect(traditional.plan).toEqual(empty);
    expect((await learning.chooseOwnSogpPath("a", { path: "podcast_two", expectedRevision: 3 })).plan).toEqual(empty);
  });

  it("identical concurrent retries create one plan/revision; changed stale drafts are refused", async () => {
    const [a,b] = await Promise.all([learning.chooseOwnSogpPath("a", initial), learning.chooseOwnSogpPath("a", initial)]);
    expect([a.revision,b.revision]).toEqual([1,1]);
    await expect(learning.editOwnSogpPlan("a", { expectedRevision: 0, episodeGuids: ["a", "c", "b", "d"] })).rejects.toThrow(/changed/i);
    expect((await learning.getOwnSogpLearning("a"))?.plan?.episodeGuids).toEqual(["a", "b", "c", "d"]);
  });

  it("one concurrent editor wins and no update is silently lost", async () => {
    await learning.chooseOwnSogpPath("a", initial);
    const results = await Promise.allSettled([
      learning.editOwnSogpPlan("a", { expectedRevision: 1, episodeGuids: ["a", "c", "b", "d"] }),
      learning.editOwnSogpPlan("a", { expectedRevision: 1, episodeGuids: ["a", "d", "c", "b"] }),
    ]);
    expect(results.filter(result => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter(result => result.status === "rejected")).toHaveLength(1);
    expect((await learning.getOwnSogpLearning("a"))?.revision).toBe(2);
  });

  it("pace/path switches preserve listens, playback, traditional credit and legacy journey", async () => {
    await learning.chooseOwnSogpPath("a", initial);
    await learning.saveOwnSogpPlayback("a", { episodeGuid: "b", positionSeconds: 285, expectedPlaybackRevision: 0 });
    await legacy.markPodcastEpisodeListened("a", "a");
    const one = await learning.chooseOwnSogpPath("a", { path: "podcast_one", expectedRevision: 2 });
    expect(one.plan).toEqual({ episodesPerDay: 1, historyEpisodeGuids: ["a"], episodeGuids: ["b", "c", "d"] });
    expect(one.progress.playbackPositions).toEqual([{ episodeGuid: "b", positionSeconds: 285, revision: 1 }]);
    const traditional = await learning.chooseOwnSogpPath("a", { path: "traditional", expectedRevision: 3 });
    expect(traditional.plan).toEqual(one.plan);
    const two = await learning.chooseOwnSogpPath("a", { path: "podcast_two", expectedRevision: 4 });
    expect(two.plan?.episodeGuids).toEqual(["b", "c", "d"]);
    expect((await runtime.db.execute(sql`select quiz_passed,notes_read from student_progress where user_id='a'`)).rows[0]).toEqual({ quiz_passed: true, notes_read: true });
    expect((await runtime.db.execute(sql`select track from podcast_journeys where user_id='a'`)).rows[0]).toEqual({ track: "series:legacy" });
    expect(two.progress.listenedEpisodeGuids.sort()).toEqual(["a", "older"]);
  });

  it("canonical retry keeps the first listened timestamp and does not bump revision twice", async () => {
    await learning.chooseOwnSogpPath("a", initial);
    await legacy.markPodcastEpisodeListened("a", "a");
    const stamp = (await runtime.db.execute(sql`select listened_at from podcast_episode_progress where user_id='a' and episode_guid='a'`)).rows;
    await legacy.markPodcastEpisodeListened("a", "a");
    expect((await learning.getOwnSogpLearning("a"))?.revision).toBe(2);
    expect((await runtime.db.execute(sql`select listened_at from podcast_episode_progress where user_id='a' and episode_guid='a'`)).rows).toEqual(stamp);
  });

  it("concurrent legacy listening and plan editing are serialised without dropping the listen", async () => {
    await learning.chooseOwnSogpPath("a", initial);
    const [marked,edited] = await Promise.allSettled([
      legacy.markPodcastEpisodeListened("a", "a"),
      learning.editOwnSogpPlan("a", { expectedRevision: 1, episodeGuids: ["b", "a", "c", "d"] }),
    ]);
    expect(marked.status).toBe("fulfilled");
    const state = await learning.getOwnSogpLearning("a");
    expect(state?.progress.listenedEpisodeGuids).toContain("a");
    expect(state?.plan?.episodeGuids).toContain("a");
    expect(state?.revision).toBe(edited.status === "fulfilled" ? 3 : 2);
  });

  it("completed slots are protected and legacy undo returns archived work to the waiting queue", async () => {
    await learning.chooseOwnSogpPath("a", initial);
    await legacy.markPodcastEpisodeListened("a", "a");
    await expect(learning.editOwnSogpPlan("a", { expectedRevision: 2, episodeGuids: ["replacement", "b", "c", "d"] })).rejects.toThrow(/completed/i);
    await learning.chooseOwnSogpPath("a", { path: "podcast_one", expectedRevision: 2 });
    await legacy.removePodcastEpisodeProgress("a", "a");
    const state = await learning.getOwnSogpLearning("a");
    expect(state?.plan).toEqual({ episodesPerDay: 1, historyEpisodeGuids: [], episodeGuids: ["a", "b", "c", "d"] });
    expect(state?.revision).toBe(4);
  });

  it("playback is owner-scoped, versioned and never awards a listen", async () => {
    await learning.chooseOwnSogpPath("a", initial);
    const input = { episodeGuid: "b", positionSeconds: 900, expectedPlaybackRevision: 0 };
    expect(await learning.saveOwnSogpPlayback("a", input)).toEqual({ episodeGuid: "b", positionSeconds: 900, revision: 1 });
    expect(await learning.saveOwnSogpPlayback("a", input)).toEqual({ episodeGuid: "b", positionSeconds: 900, revision: 1 });
    await expect(learning.saveOwnSogpPlayback("a", { ...input, positionSeconds: 100 })).rejects.toThrow(/changed/i);
    await expect(learning.saveOwnSogpPlayback("b", input)).rejects.toThrow(/plan/i);
    await expect(learning.saveOwnSogpPlayback("a", { ...input, positionSeconds: -1 })).rejects.toThrow();
    expect((await learning.getOwnSogpLearning("a"))?.progress.listenedEpisodeGuids).toEqual(["older"]);
  });

  it("validates every episode and keeps the entire old plan after a failed edit", async () => {
    await expect(learning.chooseOwnSogpPath("a", { ...initial, episodeGuids: ["a", "unavailable"] })).rejects.toThrow(/available/i);
    await learning.chooseOwnSogpPath("a", initial);
    await expect(learning.editOwnSogpPlan("a", { expectedRevision: 1, episodeGuids: ["a", "b", "c", "unavailable"] })).rejects.toThrow(/available/i);
    expect((await learning.getOwnSogpLearning("a"))?.plan?.episodeGuids).toEqual(initial.episodeGuids);
  });

  it("does not allow an archived completed episode to be copied back into editable slots", async () => {
    await learning.chooseOwnSogpPath("a", initial);
    await legacy.markPodcastEpisodeListened("a", "a");
    await learning.chooseOwnSogpPath("a", { path: "podcast_one", expectedRevision: 2 });
    await expect(learning.editOwnSogpPlan("a", { expectedRevision: 3, episodeGuids: ["a", "b", "c", "d"] })).rejects.toThrow(/history/i);
    expect((await learning.getOwnSogpLearning("a"))?.plan?.historyEpisodeGuids).toEqual(["a"]);
  });

  it("database constraints reject invalid path/pace, duplicate references and nonfinite playback", async () => {
    await learning.chooseOwnSogpPath("a", initial);
    await expect(runtime.db.execute(sql`update sogp_learning_preferences set episodes_per_day=1 where user_id='a'`)).rejects.toThrow();
    await expect(runtime.db.execute(sql`insert into sogp_learning_plan_items values('a','history',0,'a')`)).rejects.toThrow();
    await expect(runtime.db.execute(sql`insert into sogp_episode_playback(user_id,episode_guid,position_seconds) values('a','b','Infinity'::float8)`)).rejects.toThrow();
    await expect(runtime.db.execute(sql`insert into sogp_episode_playback(user_id,episode_guid,position_seconds) values('a','b','NaN'::float8)`)).rejects.toThrow();
    expect((await learning.getOwnSogpLearning("a"))?.plan?.episodesPerDay).toBe(2);
  });

  it("write rollback retains readable state; schema-disabled reads touch no new tables", async () => {
    await learning.chooseOwnSogpPath("a", initial);
    vi.stubEnv("DASHBOARD_SOGP_LEARNING_V3", "0");
    expect((await learning.getOwnSogpLearning("a"))?.revision).toBe(1);
    await expect(learning.editOwnSogpPlan("a", { expectedRevision: 1, episodeGuids: ["a"] })).rejects.toThrow(/enabled/i);
    vi.stubEnv("DASHBOARD_SOGP_LEARNING_V3_SCHEMA", "0");
    await runtime.db.execute(sql`alter table sogp_learning_preferences rename to unavailable_learning_preferences; alter table sogp_learning_plan_items rename to unavailable_learning_items; alter table sogp_episode_playback rename to unavailable_learning_playback`);
    try {
      expect(await learning.getOwnSogpLearning("a")).toBeNull();
      await legacy.markPodcastEpisodeListened("a", "a");
      expect(await legacy.getPodcastEpisodeProgress("a")).toContain("a");
    } finally {
      await runtime.db.execute(sql`alter table unavailable_learning_preferences rename to sogp_learning_preferences; alter table unavailable_learning_items rename to sogp_learning_plan_items; alter table unavailable_learning_playback rename to sogp_episode_playback`);
    }
  });

  it("real actions reject signed-out requests and ignore a forged subject", async () => {
    const actions = await import("@/app/_actions/sogp-learning-actions");
    identity.userId = null;
    expect((await actions.chooseSogpPathAction(initial)).ok).toBe(false);
    identity.userId = "a";
    expect((await actions.chooseSogpPathAction({ ...initial, userId: "b" })).ok).toBe(true);
    expect((await learning.getOwnSogpLearning("b"))?.plan).toBeNull();
  });
});
