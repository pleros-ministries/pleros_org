import "server-only";
import type { getDashboardViewer } from "./viewer";
import { getCommunityContext } from "@/lib/community/context";
import { activityLines } from "@/lib/community/ministry-report";
import { getOwnDailyDeclarations } from "@/lib/db/queries/daily-report-declarations";
import { getDayActivity, listActivitiesForDay } from "@/lib/db/queries/ministry-activities";
import { getSogpDashboardData } from "@/lib/db/queries/sogp";
import { getOwnSogpLearning } from "@/lib/db/queries/sogp-learning";
import { learningResume } from "@/lib/sogp/learning-view";
import { getOwnDisciplerSummary } from "@/lib/db/queries/community-discipleship";
import { lagosToday } from "@/lib/sogp/daily-date";
import { homeReportRows, type DashboardHomeData } from "./home";

/** Authenticated, read-only projection. No fixture identity or invented playback position. */
export async function getDashboardHomeData(viewer: NonNullable<Awaited<ReturnType<typeof getDashboardViewer>>>): Promise<DashboardHomeData> {
  const userId = viewer.session.user.id;
  const day = lagosToday();
  const ctx = await getCommunityContext();
  const [course, reports, support, state] = await Promise.all([
    viewer.capabilities.sogpEnrolled ? getSogpDashboardData(userId) : Promise.resolve(null),
    viewer.capabilities.reporting ? Promise.all([listActivitiesForDay(userId, day), getDayActivity(userId, day), getOwnDailyDeclarations(userId, day)]).then(([activities, devotional, declarations]) => homeReportRows({
      devotionalCount: activityLines(devotional).filter(line => line.detail !== null).length,
      ministryCount: activities.filter(activity => activity.kind === "outreach" || activity.kind === "follow_up").length,
      meetingCount: activities.filter(activity => activity.kind !== "outreach" && activity.kind !== "follow_up").length,
      declarations,
    })) : Promise.resolve(null),
    viewer.capabilities.community && ctx ? getOwnDisciplerSummary(ctx) : Promise.resolve(null),
    viewer.capabilities.sogpEnrolled ? getOwnSogpLearning(userId) : Promise.resolve(null),
  ]);
  const next = course?.tracks.find(track => track.accessible && track.lesson.status === "published" && !track.completed);
  const last = course?.tracks.filter(track => track.accessible && track.lesson.status === "published").at(-1);
  const lesson = next ?? last;
  const waiting = learningResume(state);
  const podcast = state?.path !== "traditional" && state?.plan;
  const planned = podcast ? new Set([...state.plan!.episodeGuids,...state.plan!.historyEpisodeGuids]) : null;
  return {
    day, community: viewer.capabilities.community, reports, support,
    learning: podcast ? {
      title: waiting ? `Day ${waiting.dayNumber} is waiting for you` : "Your current plan is complete",
      href: waiting ? `/dashboard/sogp/listen?day=${waiting.dayNumber}` : "/dashboard/sogp/plan",
      action: waiting ? "Resume listening" : "Edit your plan",
      completed: state.progress.listenedEpisodeGuids.filter(guid => planned!.has(guid)).length,
      total: planned!.size,enrolled: true,unit: "episodes",
      pathLabel: state.path === "podcast_two" ? "30 min/day · Podcast path" : "15 min/day · Podcast path",
    } : {
      title: lesson?.lesson.title ?? (course ? "Your SOGP journey" : "Start SOGP"),
      href: lesson ? `/dashboard/sogp/course/day/${lesson.dayNumber}` : course ? "/dashboard/sogp" : "/sogp/enrol",
      action: next ? "Continue lesson" : lesson ? "Open lesson" : course ? "Open learning" : "Start learning",
      completed: course?.tracks.filter(track => track.completed).length ?? 0,
      total: course?.tracks.length ?? 0, enrolled: course !== null,
    },
  };
}
