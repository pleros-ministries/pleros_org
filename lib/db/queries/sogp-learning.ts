import "server-only";
import { and, asc, eq, sql } from "drizzle-orm";
import { fetchAnchorEpisodes } from "@/lib/anchor-rss";
import { CommunityError } from "@/lib/community/errors";
import { createPodcastPlan, editPodcastPlan, switchPodcastPace, type PodcastLearningPlan, type PodcastLearningProgress, type PodcastPace } from "@/lib/sogp/podcast-plan";
import { learningGuid, learningPath, learningPosition, learningRequest, learningRevision, type SogpLearningPath } from "@/lib/sogp/learning-input";
import { withSogpLearningLock, type LearningTx } from "@/lib/db/sogp-learning-lock";
import * as s from "@/lib/db/schema";
import { requireSogpLearningWrites, sogpLearningSchemaReady } from "./sogp-learning-gate";

export type SogpLearningState = {
  path: SogpLearningPath;
  revision: number;
  plan: PodcastLearningPlan | null;
  progress: { listenedEpisodeGuids: string[]; playbackPositions: { episodeGuid: string; positionSeconds: number; revision: number }[] };
};

async function requireEnrollment(tx: LearningTx, userId: string, writing = false) {
  const rows = await tx.select({ id: s.sogpEnrollments.id, status: s.sogpEnrollments.status }).from(s.sogpEnrollments).where(eq(s.sogpEnrollments.userId,userId)).for("share");
  if (!rows.length || writing && !rows.some(row => row.status !== "withdrawn")) throw new CommunityError("An active SOGP enrolment is required for these learning settings.");
}
function domain<T>(operation: () => T): T {
  try { return operation(); } catch (error) { throw new CommunityError(error instanceof Error ? error.message : "Check your podcast plan."); }
}
function facts(state: SogpLearningState): PodcastLearningProgress {
  return { listenedEpisodeGuids: new Set(state.progress.listenedEpisodeGuids), playbackPositionSeconds: new Map(state.progress.playbackPositions.map(row => [row.episodeGuid,row.positionSeconds])) };
}

async function loadState(tx: LearningTx, userId: string): Promise<SogpLearningState> {
  // One locked transaction uses one connection; queries must not overlap.
  const preferences = await tx.select().from(s.sogpLearningPreferences).where(eq(s.sogpLearningPreferences.userId,userId)).limit(1);
  const items = await tx.select().from(s.sogpLearningPlanItems).where(eq(s.sogpLearningPlanItems.userId,userId)).orderBy(asc(s.sogpLearningPlanItems.source),asc(s.sogpLearningPlanItems.position));
  const listens = await tx.select({ episodeGuid: s.podcastEpisodeProgress.episodeGuid }).from(s.podcastEpisodeProgress).where(eq(s.podcastEpisodeProgress.userId,userId));
  const playback = await tx.select({ episodeGuid: s.sogpEpisodePlayback.episodeGuid, positionSeconds: s.sogpEpisodePlayback.positionSeconds, revision: s.sogpEpisodePlayback.revision }).from(s.sogpEpisodePlayback).where(eq(s.sogpEpisodePlayback.userId,userId)).orderBy(s.sogpEpisodePlayback.episodeGuid);
  const row = preferences[0], listened = new Set(listens.map(item => item.episodeGuid));
  // Legacy Undo is retained. An archived reference whose canonical mark was
  // undone returns to the waiting projection; reading does not write anything.
  const history = items.filter(item => item.source === "history").map(item => item.episodeGuid);
  const restored = history.filter(guid => !listened.has(guid));
  const episodeGuids = [...restored,...items.filter(item => item.source === "queue").map(item => item.episodeGuid)];
  const plan = row?.hasPodcastPlan ? { episodesPerDay: row.episodesPerDay as PodcastPace, episodeGuids, historyEpisodeGuids: history.filter(guid => listened.has(guid)) } : null;
  return { path: row?.path ?? "traditional", revision: row?.revision ?? 0, plan, progress: { listenedEpisodeGuids: [...listened], playbackPositions: playback } };
}

/** No automatic insert, inferred podcast choice or staff read bypass. */
export async function getOwnSogpLearning(userId: string): Promise<SogpLearningState | null> {
  if (!sogpLearningSchemaReady()) return null;
  return withSogpLearningLock(userId, async tx => { await requireEnrollment(tx,userId); return loadState(tx,userId); });
}
async function availableEpisodes() {
  return new Set((await fetchAnchorEpisodes()).map(episode => episode.guid));
}
const CHANGED = "Your learning plan changed in another tab. Reload before saving.";

async function persist(tx: LearningTx, userId: string, current: SogpLearningState, path: SogpLearningPath, plan: PodcastLearningPlan | null, expectedRevision: number) {
  if (current.revision > 0 && path === current.path && JSON.stringify(plan) === JSON.stringify(current.plan)) return current;
  if (expectedRevision !== current.revision) throw new CommunityError(CHANGED);
  if (plan && new Set([...plan.episodeGuids,...plan.historyEpisodeGuids]).size !== plan.episodeGuids.length + plan.historyEpisodeGuids.length) throw new CommunityError("Completed history cannot be added to the remaining queue.");
  const revision = current.revision + 1;
  await tx.insert(s.sogpLearningPreferences).values({ userId,path,revision,hasPodcastPlan: plan !== null,episodesPerDay: plan?.episodesPerDay ?? 1 }).onConflictDoUpdate({ target: s.sogpLearningPreferences.userId, set: { path,revision,hasPodcastPlan: plan !== null,episodesPerDay: plan?.episodesPerDay ?? 1,updatedAt: sql`now()` } });
  await tx.delete(s.sogpLearningPlanItems).where(eq(s.sogpLearningPlanItems.userId,userId));
  if (plan) {
    const rows = (["queue","history"] as const).flatMap(source => (source === "queue" ? plan.episodeGuids : plan.historyEpisodeGuids).map((episodeGuid,position) => ({ userId,source,position,episodeGuid })));
    if (rows.length) await tx.insert(s.sogpLearningPlanItems).values(rows);
  }
  return { ...current,path,revision,plan };
}

export async function chooseOwnSogpPath(userId: string, value: unknown): Promise<SogpLearningState> {
  requireSogpLearningWrites();
  const input = learningRequest(value), path = learningPath(input.path), expectedRevision = learningRevision(input.expectedRevision);
  const catalogue = input.episodeGuids === undefined ? null : await availableEpisodes();
  return withSogpLearningLock(userId, async tx => {
    await requireEnrollment(tx,userId,true);
    const current = await loadState(tx,userId);
    let plan = current.plan;
    if (path !== "traditional") {
      const pace = path === "podcast_one" ? 1 : 2;
      if (!plan) {
        if (!Array.isArray(input.episodeGuids) || !input.episodeGuids.length) throw new CommunityError("Choose episodes for your podcast plan first.");
        plan = domain(() => createPodcastPlan(input.episodeGuids as string[],pace));
        if (plan.episodeGuids.some(guid => !catalogue?.has(guid))) throw new CommunityError("One of those episodes is not available. Your choice is unchanged.");
      } else {
        if (input.episodeGuids !== undefined && JSON.stringify(input.episodeGuids) !== JSON.stringify(plan.episodeGuids)) throw new CommunityError("A plan already exists. Use the plan editor to change its episodes.");
        plan = domain(() => switchPodcastPace(plan!,pace,facts(current)));
      }
    }
    return persist(tx,userId,current,path,plan,expectedRevision);
  });
}

export async function editOwnSogpPlan(userId: string, value: unknown): Promise<SogpLearningState> {
  requireSogpLearningWrites();
  const input = learningRequest(value), expectedRevision = learningRevision(input.expectedRevision), catalogue = await availableEpisodes();
  return withSogpLearningLock(userId, async tx => {
    await requireEnrollment(tx,userId,true);
    const current = await loadState(tx,userId);
    if (!current.plan) throw new CommunityError("Choose a podcast plan first.");
    const plan = domain(() => editPodcastPlan(current.plan!,input.episodeGuids as string[],facts(current),catalogue));
    return persist(tx,userId,current,current.path,plan,expectedRevision);
  });
}

export async function saveOwnSogpPlayback(userId: string, value: unknown) {
  requireSogpLearningWrites();
  const input = learningRequest(value), episodeGuid = learningGuid(input.episodeGuid), positionSeconds = learningPosition(input.positionSeconds), expected = learningRevision(input.expectedPlaybackRevision);
  return withSogpLearningLock(userId, async tx => {
    await requireEnrollment(tx,userId,true);
    const [item] = await tx.select({ guid: s.sogpLearningPlanItems.episodeGuid }).from(s.sogpLearningPlanItems).where(and(eq(s.sogpLearningPlanItems.userId,userId),eq(s.sogpLearningPlanItems.episodeGuid,episodeGuid))).limit(1);
    if (!item) throw new CommunityError("That episode is not in your learning plan.");
    const [old] = await tx.select().from(s.sogpEpisodePlayback).where(and(eq(s.sogpEpisodePlayback.userId,userId),eq(s.sogpEpisodePlayback.episodeGuid,episodeGuid))).limit(1);
    if (old?.positionSeconds === positionSeconds) return { episodeGuid,positionSeconds,revision: old.revision };
    if (expected !== (old?.revision ?? 0)) throw new CommunityError("Your saved playback changed in another tab. Reload before saving.");
    const revision = (old?.revision ?? 0) + 1;
    await tx.insert(s.sogpEpisodePlayback).values({ userId,episodeGuid,positionSeconds,revision }).onConflictDoUpdate({ target: [s.sogpEpisodePlayback.userId,s.sogpEpisodePlayback.episodeGuid],set: { positionSeconds,revision,updatedAt: sql`now()` } });
    return { episodeGuid,positionSeconds,revision };
  });
}
