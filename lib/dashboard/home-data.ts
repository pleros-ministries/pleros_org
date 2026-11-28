import "server-only";
import type { getDashboardViewer } from "./viewer";
import { activityLines } from "@/lib/community/ministry-report";
import { getOwnDailyDeclarations } from "@/lib/db/queries/daily-report-declarations";
import { getDayActivity, listActivitiesForDay } from "@/lib/db/queries/ministry-activities";
import { getSogpDashboardData } from "@/lib/db/queries/sogp";
import { getOwnSogpLearning } from "@/lib/db/queries/sogp-learning";
import { learningResume } from "@/lib/sogp/learning-view";
import { getLearningCatalogue } from "@/lib/db/queries/learning-catalogue";
import { isPlanPath } from "@/lib/sogp/learning-input";
import { lagosToday } from "@/lib/sogp/daily-date";
import { getOwnCertificationFacts } from "@/lib/db/queries/sogp-certification-facts";
import { getHomeDiscipleshipSummary } from "@/lib/db/queries/sogp-discipleship";
import { getActiveSogpJourney } from "@/lib/db/queries/sogp-journey";
import { getHomeInvite } from "@/lib/db/queries/sogp-referrals";
import { getMonthlyLeaderboard } from "@/lib/db/queries/monthly-leaderboard";
import { previewMonthlyLeaderboard } from "@/lib/leaderboard/monthly";
import { getReminderPreferences } from "@/lib/db/queries/notification-preferences";
import { getNextLearning, getNextLearningCard } from "@/lib/db/queries/next-learning";
import { cohortWeekLabel, homeReportRows, homeSogpToday, type DashboardHomeData, type HomeSogp } from "./home";
import { getMonthCalendarData } from "./month-data";

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
    // One board for everyone signed in (Pastor, 25 November 2026).
    getMonthlyLeaderboard(userId).catch(() => null),
    enrolled ? getHomeDiscipleshipSummary(userId).catch(() => ({ kind: "none" as const })) : Promise.resolve({ kind: "none" as const }),
    // Unreadable preferences hide the row rather than nag.
    getReminderPreferences(userId).then(prefs => prefs.remindersSavedAt !== null).catch(() => true),
    enrolled ? getHomeInvite(userId).catch(() => null) : Promise.resolve(null),
  ]);
  const next = course?.tracks.find(track => track.accessible && track.lesson.status === "published" && !track.completed);
  const last = course?.tracks.filter(track => track.accessible && track.lesson.status === "published").at(-1);
  const lesson = next ?? last;
  const waiting = learningResume(state);
  const podcast = isPlanPath(state?.path) && state?.plan;
  const doctrinal = state?.path === "doctrinal";
  // A plan path saved before its plan (user, 24 November).
  const planless = Boolean(state?.revision && isPlanPath(state.path) && !state.plan);
  const planned = podcast ? new Set([...state.plan!.episodeGuids,...state.plan!.historyEpisodeGuids]) : null;
  // Real facts only: course completion for traditional, saved listens/positions for podcasts.
  let card: DashboardHomeData["card"];
  if (!course || !state?.revision && !course.tracks.some(track => track.completed)) {
    card = { kind: "start", href: course ? "/dashboard/sogp/path" : "/sogp/enrol" };
  } else if (planless) {
    card = doctrinal
      ? { kind: "start", href: "/dashboard/sogp/plan?path=doctrinal", meta: "Personalised path", title: "Choose your teachings", summary: "Your path is saved. Pick teachings from the Library next", action: "Choose teachings" }
      : { kind: "start", href: `/dashboard/sogp/plan?path=${state!.path}`, meta: state!.path === "podcast_two" ? "30 min a day · Podcast" : "15 min a day · Podcast", title: "Finish building your plan", summary: "Your path is saved. Take our plan or pick your own episodes", action: "Build my plan" };
  } else if (podcast && waiting) {
    const catalogue = new Map((await getLearningCatalogue().catch(() => [])).map(row => [row.guid, row]));
    const positions = new Map(state.progress.playbackPositions.map(row => [row.episodeGuid, row.positionSeconds]));
    const listenedSet = new Set(state.progress.listenedEpisodeGuids);
    const parsed = waiting.episodeGuids.map(guid => {
      const item = catalogue.get(guid), title = item?.title ?? "Episode";
      const match = /^(.*?)\s*\((Part\s+\d+)\)\s*$/i.exec(title);
      const durationSeconds = (item?.duration ?? "").split(":").map(Number).reduce((total, value) => Number.isNaN(value) ? total : total * 60 + value, 0);
      // A doctrinal journey's item is a whole teaching, named as it is.
      if (doctrinal) return { series: title, part: title, duration: item?.duration ?? "", durationSeconds, positionSeconds: positions.get(guid) ?? 0, listened: listenedSet.has(guid) };
      return { series: match?.[1] ?? title, part: match?.[2] ?? title, duration: item?.duration ?? "", durationSeconds, positionSeconds: positions.get(guid) ?? 0, listened: listenedSet.has(guid) };
    });
    card = { kind: "podcast", doctrinal, pace: state.plan!.episodesPerDay, href: `/dashboard/sogp/listen?day=${waiting.dayNumber}`, series: parsed[0]?.series ?? "Your podcast plan", dayNumber: waiting.dayNumber,
      episodes: parsed.map(({ part, duration, durationSeconds, positionSeconds, listened }) => ({ part, duration, durationSeconds, positionSeconds, listened })) };
  } else if (!podcast && lesson) {
    card = { kind: "traditional", title: lesson.lesson.title, level: lesson.curriculumLevel, href: `/dashboard/sogp/course/day/${lesson.dayNumber}`, completed: course.tracks.filter(track => track.completed).length, total: course.tracks.length };
  }
  // Learning's own rules (user, 27 November): withdrawn says so; once SOGP is
  // finished or the cohort has ended, the chosen next learning heads the card,
  // and a finished doctrinal path celebrates instead of resuming its last track.
  if (course) {
    const chosen = Boolean(state?.revision || course.tracks.some(track => track.completed));
    const published = course.tracks.filter(track => track.lesson.status === "published" && track.dayNumber != null);
    const doneAll = !podcast && published.length > 0 && published.every(track => track.completed);
    const endsAt = course.cohort?.endsAt;
    const ended = course.learnerState === "completed" || (endsAt ? Date.now() > new Date(endsAt).getTime() : false);
    if (course.learnerState === "withdrawn") {
      if (chosen) card = { kind: "withdrawn", title: card?.kind === "traditional" ? card.title : card?.kind === "podcast" ? card.series : "Your SOGP journey" };
    } else if (chosen && (doneAll || (podcast && !waiting) || ended)) {
      const nextCard = await getNextLearning(userId).then(choice => choice ? getNextLearningCard(userId) : null).catch(() => null);
      if (nextCard) card = { kind: "next", title: nextCard.title, episodeTitle: nextCard.episodeTitle, episodeNumber: nextCard.episodeNumber, totalDays: nextCard.totalDays, listened: nextCard.listened, finished: nextCard.finished, todayListened: nextCard.todayListened };
      else if (doneAll) card = { kind: "finished", tracks: published.length, certificate: Boolean(course.certificate && !course.certificate.revokedAt) };
      // Cohort over, SOGP not finished: as on Learning, the lessons stay open and the card says why.
      else if (ended && (card?.kind === "traditional" || card?.kind === "podcast")) card = { ...card, ended: true };
    }
  }
  // The shared month (Pastor, 25 November 2026); unreadable, Home shows Today without it.
  const month = journey && card?.kind !== "start" ? await getMonthCalendarData(userId, { state, course }).catch(() => null) : null;
  const sogp: HomeSogp | null = journey ? {
    cohortTitle: journey.cohort.title,
    weekLabel: cohortWeekLabel(journey.cohort.startsAt, journey.cohort.endsAt, day),
    // On the podcast path, today's teaching is the plan's day, ticked by the player.
    // Your SOGP days wait until a path is chosen, so a new enrolee isn't told to catch up (fix 2).
    today: card?.kind === "start" ? null : homeSogpToday(journey.days, day, podcast
      ? card?.kind === "podcast" ? { title: card.doctrinal ? card.series : `${card.series} · ${card.episodes.map(episode => episode.part).join(" and ")}`, href: card.href, done: card.episodes.every(episode => episode.listened) } : null
      : undefined, month?.morningPrayedToday ?? false),
    month: month ? { key: month.month.key, name: month.month.name, todayKey: month.todayKey, daysLeft: month.month.daysLeft, daysSoFar: month.month.daysSoFar, podcast: month.podcast, days: month.days } : null,
    progress: facts ? {
      teaching: facts.podcast
        ? { done: facts.learningDone, total: facts.learningTotal, unit: "episodes" }
        : { done: journey.days.filter(row => row.track?.audioListened).length, total: journey.days.filter(row => row.track).length, unit: "days" },
      prayer: { percent: facts.prayer.percent, required: facts.prayer.required },
      assessment: facts.podcast ? null : { done: facts.learningDone, total: facts.learningTotal },
    } : null,
    group,
    invite,
    shareDayNumber: journey.days.find(row => row.dateKey === day)?.track?.dayNumber ?? lesson?.dayNumber ?? null,
  } : null;
  return {
    day, reports, card, sogp,
    welcomePack: { done: welcomePackDone },
    leaderboard: leaderboard ? previewMonthlyLeaderboard(leaderboard) : null,
    learning: podcast ? {
      title: waiting ? `Day ${waiting.dayNumber} is waiting for you` : "Your current plan is complete",
      href: waiting ? `/dashboard/sogp/listen?day=${waiting.dayNumber}` : "/dashboard/sogp/plan",
      action: waiting ? "Resume listening" : "Edit your plan",
      completed: state.progress.listenedEpisodeGuids.filter(guid => planned!.has(guid)).length,
      total: planned!.size,enrolled: true,unit: "episodes",
      pathLabel: doctrinal ? "One a day · Personalised path" : state.path === "podcast_two" ? "30 min a day · Podcast path" : "15 min a day · Podcast path",
    } : {
      title: lesson?.lesson.title ?? (course ? "Your SOGP journey" : "Start SOGP"),
      href: lesson ? `/dashboard/sogp/course/day/${lesson.dayNumber}` : course ? "/dashboard/sogp" : "/sogp/enrol",
      action: next ? "Continue lesson" : lesson ? "Open lesson" : course ? "Open learning" : "Start learning",
      completed: course?.tracks.filter(track => track.completed).length ?? 0,
      total: course?.tracks.length ?? 0, enrolled: course !== null,
    },
  };
}
