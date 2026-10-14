import type { SogpLearningState } from "@/lib/db/queries/sogp-learning";
import { readPodcastPlan, type PodcastPace } from "./podcast-plan";
import suggestions from "./podcast-suggestions.json";

export type LearningEpisode = { guid: string; title: string; duration: string; audioUrl: string };
export type LearningViewData = {
  state: SogpLearningState | null;
  episodes: LearningEpisode[];
  canWrite: boolean;
  traditional: { completed: number; total: number; nextTitle: string | null; resumeHref: string };
};
const normaliseTitle = (title: string) => title.replace(/[’‘]/g,"'").trim().toLowerCase();
export function podcastSuggestion(episodes: { guid: string; title: string }[], pace: PodcastPace): string[] {
  const byTitle = new Map(episodes.map(episode => [normaliseTitle(episode.title),episode.guid]));
  const selected = pace === 1 ? suggestions.suggested30EpisodeDefault : suggestions.suggested60EpisodeDefault;
  return [...new Set(selected.flatMap(episode => { const guid = byTitle.get(normaliseTitle(episode.title)); return guid ? [guid] : []; }))];
}
export function learningResume(state: SogpLearningState | null) {
  if (!state?.plan || state.path === "traditional") return null;
  const next = readPodcastPlan(state.plan,{ listenedEpisodeGuids: new Set(state.progress.listenedEpisodeGuids), playbackPositionSeconds: new Map(state.progress.playbackPositions.map(row => [row.episodeGuid,row.positionSeconds])) }).nextDay;
  return next ? { dayNumber: next.dayNumber, listened: next.episodes.filter(episode => episode.listened).length, total: next.episodes.length, episodeGuids: next.episodes.map(episode => episode.episodeGuid) } : null;
}
/** Swap two unfinished slots; completed indices never shift. */
export function moveRemainingEpisode(guids: readonly string[], listened: ReadonlySet<string>, from: number, to: number): string[] {
  if (!Number.isInteger(from) || !Number.isInteger(to) || from < 0 || to < 0 || from >= guids.length || to >= guids.length) throw new Error("Choose an available slot.");
  if (listened.has(guids[from]) || listened.has(guids[to])) throw new Error("Completed episodes cannot be moved.");
  const result = [...guids];
  [result[from],result[to]] = [result[to],result[from]];
  return result;
}
