import "server-only";
import { getSogpDashboardData } from "./sogp";
import { getOwnSogpLearning } from "./sogp-learning";
import { sogpLearningWritesEnabled } from "./sogp-learning-gate";
import { fetchAnchorEpisodes } from "@/lib/anchor-rss";
import type { LearningViewData } from "@/lib/sogp/learning-view";

/** Session-owned adapter. Never serialize enrolment PII, unpublished content or staff data. */
export async function getOwnLearningView(userId: string): Promise<LearningViewData | null> {
  const dashboard = await getSogpDashboardData(userId);
  if (!dashboard) return null;
  const [state, episodes] = await Promise.all([getOwnSogpLearning(userId),fetchAnchorEpisodes()]);
  const published = dashboard.tracks.filter(track => track.lesson.status === "published");
  const next = published.find(track => track.accessible && !track.completed && track.dayNumber !== null);
  return {
    state,
    episodes: episodes.map(({ guid,title,duration,audioUrl }) => ({ guid,title,duration,audioUrl })),
    canWrite: sogpLearningWritesEnabled() && dashboard.learnerState !== "withdrawn",
    traditional: { completed: published.filter(track => track.completed).length, total: published.length, nextTitle: next?.lesson.title ?? null, resumeHref: next ? `/dashboard/sogp/course/day/${next.dayNumber}` : "/dashboard/sogp/traditional" },
  };
}
