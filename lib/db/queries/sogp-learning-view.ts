import "server-only";
import { getSogpDashboardData } from "./sogp";
import { getOwnSogpLearning } from "./sogp-learning";
import { sogpLearningWritesEnabled } from "./sogp-learning-gate";
import { getLearningCatalogue } from "./learning-catalogue";
import type { LearningViewData } from "@/lib/sogp/learning-view";
import { db } from "@/lib/db";
import { pastorAssignments,sogpFollowUpRoutes,users } from "@/lib/db/schema";
import { and,eq } from "drizzle-orm";

/** Each SOGP level's tracks and dates for the chooser; a level opens once the one before is complete. */
function chooserLevels(published: Array<{ curriculumLevel: number; completed: boolean; releaseAt: Date | string; lesson: { title: string } }>) {
  const levels = [1, 2, 3, 4].map(level => {
    const tracks = published.filter(track => track.curriculumLevel === level).sort((a, b) => new Date(a.releaseAt).getTime() - new Date(b.releaseAt).getTime());
    return { level, tracks: tracks.map(track => ({ title: track.lesson.title, releaseAt: new Date(track.releaseAt).toISOString() })), done: tracks.filter(track => track.completed).length };
  });
  return levels.map((entry, index) => {
    const before = levels[index - 1];
    return { ...entry, open: index === 0 || Boolean(before && before.tracks.length && before.done >= before.tracks.length) };
  });
}

/** Session-owned adapter. Never serialize enrolment PII, unpublished content or staff data. */
export async function getOwnLearningView(userId: string): Promise<LearningViewData | null> {
  const dashboard = await getSogpDashboardData(userId);
  if (!dashboard) return null;
  const [state, episodes] = await Promise.all([getOwnSogpLearning(userId),getLearningCatalogue()]);
  const published = dashboard.tracks.filter(track => track.lesson.status === "published");
  const next = published.find(track => track.accessible && !track.completed && track.dayNumber !== null);
  // The route only describes the owner it assigned; a later admin change reads as "Current follow-up".
  const [followUp] = await db.select({ name:users.name,source:sogpFollowUpRoutes.source,choice:sogpFollowUpRoutes.choice }).from(pastorAssignments).innerJoin(users,eq(pastorAssignments.pastorUserId,users.id))
    .leftJoin(sogpFollowUpRoutes,and(eq(sogpFollowUpRoutes.enrollmentId,pastorAssignments.enrollmentId),eq(sogpFollowUpRoutes.ownerUserId,pastorAssignments.pastorUserId)))
    .where(eq(pastorAssignments.enrollmentId,dashboard.enrollment.id)).limit(1);
  return {
    state,
    episodes,
    canWrite: sogpLearningWritesEnabled() && dashboard.learnerState !== "withdrawn",
    writeBlockReason: dashboard.learnerState === "withdrawn" ? "withdrawn" : sogpLearningWritesEnabled() ? null : "not_enabled",
    followUp: followUp ?? null,
    traditional: { completed: published.filter(track => track.completed).length, total: published.length, nextTitle: next?.lesson.title ?? null, resumeHref: next ? `/dashboard/sogp/course/day/${next.dayNumber}` : "/dashboard/sogp/traditional", levels: chooserLevels(published) },
  };
}
