import "server-only";
import type { getDashboardViewer } from "./viewer";
import { activityLines } from "@/lib/community/ministry-report";
import { getOwnDailyDeclarations } from "@/lib/db/queries/daily-report-declarations";
import { getDayActivity, listActivitiesForDay } from "@/lib/db/queries/ministry-activities";
import { getSogpDashboardData } from "@/lib/db/queries/sogp";
import { getOwnSogpLearning } from "@/lib/db/queries/sogp-learning";
import { learningResume } from "@/lib/sogp/learning-view";
import { fetchAnchorEpisodes } from "@/lib/anchor-rss";
import { lagosToday } from "@/lib/sogp/daily-date";
import { getOwnCertificationFacts } from "@/lib/db/queries/sogp-certification-facts";
import { getHomeDiscipleshipSummary } from "@/lib/db/queries/sogp-discipleship";
import { getActiveSogpJourney } from "@/lib/db/queries/sogp-journey";
import { getSogpLeaderboard } from "@/lib/db/queries/sogp-leaderboard";
import { getHomeInvite } from "@/lib/db/queries/sogp-referrals";
import { getReminderPreferences } from "@/lib/db/queries/notification-preferences";
import { cohortWeekLabel, homeReportRows, homeSogpToday, type DashboardHomeData, type HomeSogp } from "./home";

/** Authenticated, read-only projection. No fixture identity or invented playback position. */
export async function getDashboardHomeData(viewer: NonNullable<Awaited<ReturnType<typeof getDashboardViewer>>>): Promise<DashboardHomeData> {
  const userId = viewer.session.user.id;
  const day = lagosToday();
  const enrolled = viewer.capabilities.sogpEnrolled;
  const [course, reports, state, journey, facts, leaderboard, group, welcomePackDone, invite] = await Promise.all([
    viewer.capabilities.sogpEnrolled ? getSogpDashboardData(userId) : Promise.resolve(null),
    viewer.capabilities.reporting ? Promise.all([listActivitiesForDay(userId, day), getDayActivity(userId, day), getOwnDailyDeclarations(userId, day)]).then(([activities, devotional, declarations]) => homeReportRows({
      devotionalCount: activityLines(devotional).filter(line => line.detail !== null).length,
      ministryCount: activities.filter(activity => activity.kind === "outreach" || activity.kind === "follow_up").length,
      meetingCount: activities.filter(activity => activity.kind !== "outreach" && activity.kind !== "follow_up").length,
      declarations,
    })) : Promise.resolve(null),
    viewer.capabilities.sogpEnrolled ? getOwnSogpLearning(userId) : Promise.resolve(null),
    // SOGP is the home's centre. Each read degrades to "not shown" on its own.
    enrolled ? getActiveSogpJourney(userId).catch(() => null) : Promise.resolve(null),
    enrolled ? getOwnCertificationFacts(userId).catch(() => null) : Promise.resolve(null),
    enrolled ? getSogpLeaderboard(userId).catch(() => null) : Promise.resolve(null),
    enrolled ? getHomeDiscipleshipSummary(userId).catch(() => ({ kind: "none" as const })) : Promise.resolve({ kind: "none" as const }),
    // Unreadable preferences hide the row rather than nag.
    getReminderPreferences(userId).then(prefs => prefs.remindersSavedAt !== null).catch(() => true),
    enrolled ? getHomeInvite(userId).catch(() => null) : Promise.resolve(null),
  ]);
  const next = course?.tracks.find(track => track.accessible && track.lesson.status === "published" && !track.completed);
  const last = course?.tracks.filter(track => track.accessible && track.lesson.status === "published").at(-1);
  const lesson = next ?? last;
  const waiting = learningResume(state);
  const podcast = state?.path !== "traditional" && state?.plan;
  const planned = podcast ? new Set([...state.plan!.episodeGuids,...state.plan!.historyEpisodeGuids]) : null;
  // Real facts only: course completion for traditional, saved listens/positions for podcasts.
  let card: DashboardHomeData["card"];
  if (!course || !state?.revision && !course.tracks.some(track => track.completed)) {
    card = { kind: "start", href: course ? "/dashboard/sogp/path" : "/sogp/enrol" };
  } else if (podcast && waiting) {
    const catalogue = new Map((await fetchAnchorEpisodes().catch(() => [])).map(row => [row.guid, row]));
    const positions = new Map(state.progress.playbackPositions.map(row => [row.episodeGuid, row.positionSeconds]));
    const listenedSet = new Set(state.progress.listenedEpisodeGuids);
    const parsed = waiting.episodeGuids.map(guid => {
      const item = catalogue.get(guid), title = item?.title ?? "Episode";
      const match = /^(.*?)\s*\((Part\s+\d+)\)\s*$/i.exec(title);
      const durationSeconds = (item?.duration ?? "").split(":").map(Number).reduce((total, value) => Number.isNaN(value) ? total : total * 60 + value, 0);
      return { series: match?.[1] ?? title, part: match?.[2] ?? title, duration: item?.duration ?? "", durationSeconds, positionSeconds: positions.get(guid) ?? 0, listened: listenedSet.has(guid) };
    });
    card = { kind: "podcast", pace: state.plan!.episodesPerDay, href: `/dashboard/sogp/listen?day=${waiting.dayNumber}`, series: parsed[0]?.series ?? "Your podcast plan", dayNumber: waiting.dayNumber,
      episodes: parsed.map(({ part, duration, durationSeconds, positionSeconds, listened }) => ({ part, duration, durationSeconds, positionSeconds, listened })) };
  } else if (!podcast && lesson) {
    card = { kind: "traditional", title: lesson.lesson.title, level: lesson.curriculumLevel, href: `/dashboard/sogp/course/day/${lesson.dayNumber}`, completed: course.tracks.filter(track => track.completed).length, total: course.tracks.length };
  }
  const sogp: HomeSogp | null = journey ? {
    cohortTitle: journey.cohort.title,
    weekLabel: cohortWeekLabel(journey.cohort.startsAt, journey.cohort.endsAt, day),
    today: homeSogpToday(journey.days, day, !podcast),
    progress: facts ? {
      learningLabel: facts.podcast ? "Episodes" : "Teachings",
      learningDone: facts.learningDone,
      learningTotal: facts.learningTotal,
      prayerPercent: facts.prayer.percent,
      prayerRequired: facts.prayer.required,
      reviewsSatisfied: facts.reviews.attended + facts.reviews.madeUp,
      reviewsOwed: facts.reviews.owed,
      checksPassed: [facts.learningPass, facts.prayer.pass, facts.reviews.reviewPass].filter(Boolean).length,
    } : null,
    leaderboard: leaderboard?.me ? { rank: leaderboard.me.rank, points: leaderboard.me.points } : null,
    board: leaderboard && leaderboard.top.length ? {
      top: leaderboard.top.slice(0, 5).map(row => ({ rank: row.rank, name: row.name, points: row.points, isMe: row.isMe })),
      me: leaderboard.me ? { rank: leaderboard.me.rank, points: leaderboard.me.points } : null,
      total: leaderboard.total,
    } : null,
    group,
    invite,
    shareDayNumber: journey.days.find(row => row.dateKey === day)?.track?.dayNumber ?? lesson?.dayNumber ?? null,
  } : null;
  return {
    day, reports, card, sogp,
    welcomePack: { done: welcomePackDone },
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
