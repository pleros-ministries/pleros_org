import "server-only";
import { getSogpDashboardData } from "./sogp";
import { getOwnSogpLearning } from "./sogp-learning";
import { sogpLearningWritesEnabled } from "./sogp-learning-gate";
import { fetchAnchorEpisodes } from "@/lib/anchor-rss";
import type { LearningViewData } from "@/lib/sogp/learning-view";
import { db } from "@/lib/db";
import { pastorAssignments,sogpFollowUpRoutes,users } from "@/lib/db/schema";
import { and,eq } from "drizzle-orm";

/** Session-owned adapter. Never serialize enrolment PII, unpublished content or staff data. */
export async function getOwnLearningView(userId: string): Promise<LearningViewData | null> {
  const dashboard = await getSogpDashboardData(userId);
  if (!dashboard) return null;
  const [state, episodes] = await Promise.all([getOwnSogpLearning(userId),fetchAnchorEpisodes()]);
  const published = dashboard.tracks.filter(track => track.lesson.status === "published");
  const next = published.find(track => track.accessible && !track.completed && track.dayNumber !== null);
  // The route only describes the owner it assigned; a later admin change reads as "Current follow-up".
  const [followUp] = await db.select({ name:users.name,source:sogpFollowUpRoutes.source,choice:sogpFollowUpRoutes.choice }).from(pastorAssignments).innerJoin(users,eq(pastorAssignments.pastorUserId,users.id))
    .leftJoin(sogpFollowUpRoutes,and(eq(sogpFollowUpRoutes.enrollmentId,pastorAssignments.enrollmentId),eq(sogpFollowUpRoutes.ownerUserId,pastorAssignments.pastorUserId)))
    .where(eq(pastorAssignments.enrollmentId,dashboard.enrollment.id)).limit(1);
  return {
    state,
    episodes: episodes.map(({ guid,title,duration,audioUrl }) => ({ guid,title,duration,audioUrl })),
    canWrite: sogpLearningWritesEnabled() && dashboard.learnerState !== "withdrawn",
    writeBlockReason: dashboard.learnerState === "withdrawn" ? "withdrawn" : sogpLearningWritesEnabled() ? null : "not_enabled",
    followUp: followUp ?? null,
    traditional: { completed: published.filter(track => track.completed).length, total: published.length, nextTitle: next?.lesson.title ?? null, resumeHref: next ? `/dashboard/sogp/course/day/${next.dayNumber}` : "/dashboard/sogp/traditional" },
  };
}
