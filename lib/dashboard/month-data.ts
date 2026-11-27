import "server-only";

import { getLearningCatalogue } from "@/lib/db/queries/learning-catalogue";
import { getMonthActivityRows } from "@/lib/db/queries/month-activity";
import type { SogpLearningState } from "@/lib/db/queries/sogp-learning";
import { monthWindow, type MonthWindow } from "@/lib/leaderboard/monthly";
import { buildMonthPlan, type MonthActivity, type MonthItem, type MonthPlan } from "@/lib/learning/month-calendar";
import { lagosToday } from "@/lib/sogp/daily-date";
import { isPlanPath, type SogpLearningPath } from "@/lib/sogp/learning-input";
import { readPodcastPlan } from "@/lib/sogp/podcast-plan";
import type { SogpDashboardData } from "@/lib/sogp/types";

export type MonthCalendarData = MonthPlan & {
  month: MonthWindow;
  /** The saved path; null before one is chosen. */
  path: SogpLearningPath | null;
  todayKey: string;
  /** Podcast or Personalised: learning is listening. */
  podcast: boolean;
  /** The 5:30 am Prayer Watch is ticked for today. */
  morningPrayedToday: boolean;
  /** One plan day holds this many items (two at 30 minutes a day). */
  perDay: number;
  /** Planned items left in your path, today's included. */
  itemsLeft: number;
};

type Catalogue = Map<string, { title: string; series?: string }>;
const PART = /^(.*?)\s*\((Part\s+\d+)\)\s*$/i;

/** "The Reality of God’s Purpose" / "Part 3"; a Library teaching keeps its own title. */
function episodeItem(guid: string, catalogue: Catalogue): MonthItem {
  const entry = catalogue.get(guid);
  if (guid.startsWith("teaching:")) return { title: entry?.title ?? "Teaching", meta: entry?.series ?? "From the Library" };
  const match = PART.exec(entry?.title ?? "");
  return match ? { title: match[1]!, meta: match[2]! } : { title: entry?.title ?? "Episode", meta: "Podcast" };
}

/** A plan day of one or two episodes: "Part 3 and Part 4" under the first one's series. */
function planDayItem(guids: readonly string[], catalogue: Catalogue, href: string): MonthItem {
  const items = guids.map(guid => episodeItem(guid, catalogue));
  return { title: items[0]!.title, meta: items.map(item => item.meta).join(" and "), href };
}

/**
 * The shared month for one SOGP learner (Pastor, 25 November 2026): what they
 * did each day so far, and their path's next days laid out from today to the
 * month's end. Progress stays individual; only the calendar is shared.
 */
export async function getMonthCalendarData(userId: string, { state, course }: { state: SogpLearningState | null; course: SogpDashboardData | null }): Promise<MonthCalendarData> {
  const todayKey = lagosToday();
  const month = monthWindow(todayKey);
  const plan = isPlanPath(state?.path) ? state?.plan ?? null : null;
  const [rows, catalogue] = await Promise.all([
    getMonthActivityRows(userId, month.startKey, todayKey),
    getLearningCatalogue().then(list => new Map(list.map(row => [row.guid, row])) as Catalogue).catch(() => new Map() as Catalogue),
  ]);

  const trackByLesson = new Map((course?.tracks ?? []).map(track => [track.lesson.id, track]));
  const learnt: MonthActivity["learnt"] = {};
  const add = (dateKey: string, item: MonthItem) => { (learnt[dateKey] ??= []).push(item); };
  for (const row of rows.episodes) add(row.dateKey, episodeItem(row.guid, catalogue));
  for (const row of rows.lessons) {
    const track = trackByLesson.get(row.lessonId);
    add(row.dateKey, { title: row.title, meta: track?.dayNumber ? `Level ${track.curriculumLevel} · track ${track.dayNumber}` : "SOGP", href: track?.dayNumber ? `/dashboard/sogp/course/day/${track.dayNumber}` : null });
  }
  for (const row of rows.preparation) add(row.dateKey, { title: "Pre-SOGP", meta: row.label });

  // Your path's unfinished days, in order: plan days on Podcast and
  // Personalised, the tracks still to finish on the Doctrinal path.
  let items: MonthItem[] = [];
  if (plan) {
    const read = readPodcastPlan(plan, { listenedEpisodeGuids: new Set(state!.progress.listenedEpisodeGuids), playbackPositionSeconds: new Map() });
    items = read.days.filter(day => !day.complete).map(day => planDayItem(day.episodes.filter(episode => !episode.listened).map(episode => episode.episodeGuid), catalogue, `/dashboard/sogp/listen?day=${day.dayNumber}`));
  } else if (state?.path === "traditional" || (!state?.revision && course?.tracks.some(track => track.completed))) {
    items = (course?.tracks ?? [])
      .filter(track => track.lesson.status === "published" && track.dayNumber != null && !track.completed)
      .sort((a, b) => a.dayNumber! - b.dayNumber!)
      .map(track => ({ title: track.lesson.title, meta: `Level ${track.curriculumLevel} · track ${track.dayNumber}`, href: `/dashboard/sogp/course/day/${track.dayNumber}` }));
  }

  const built = buildMonthPlan({ monthKey: month.key, todayKey, activity: { learnt, prayer: rows.prayer, bible: rows.bible }, plan: items });
  return {
    ...built,
    month,
    path: state?.revision ? state.path : course?.tracks.some(track => track.completed) ? "traditional" : null,
    todayKey,
    podcast: Boolean(plan),
    morningPrayedToday: rows.morningPrayer.includes(todayKey),
    perDay: plan?.episodesPerDay ?? 1,
    itemsLeft: items.length,
  };
}

const dayMonth = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", timeZone: "UTC" });
const nextMonthName = new Intl.DateTimeFormat("en-GB", { month: "long", timeZone: "UTC" });

/**
 * One line on what follows this month: the days carrying into next month, or
 * the day the plan ends, then what the path leads to.
 */
export function monthCarryNote(data: Pick<MonthCalendarData, "carried" | "finishKey" | "month" | "path">) {
  if (!data.finishKey) return null;
  const [year, month] = data.month.key.split("-").map(Number);
  const next = nextMonthName.format(new Date(Date.UTC(year!, month!, 1)));
  const lead = data.carried ? `${data.carried} ${data.carried === 1 ? "day carries" : "days carry"} into ${next}, ending ${dayMonth.format(new Date(`${data.finishKey}T00:00:00.000Z`))}.` : `Your plan ends on ${dayMonth.format(new Date(`${data.finishKey}T00:00:00.000Z`))}.`;
  const then = data.path === "podcast_one" || data.path === "podcast_two" ? " Then the doctrinal path from level 1." : data.path === "doctrinal" ? " Add teachings from the Library at any time." : "";
  return lead + then;
}
