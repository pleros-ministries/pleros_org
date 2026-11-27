import type { DashboardHomeData, HomeSogp } from "@/lib/dashboard/home";
import type { LearningHubData } from "@/lib/dashboard/learning-hub";
import { SOGP_LEVELS } from "@/lib/sogp/curriculum";
import type { LearningViewData } from "@/lib/sogp/learning-view";
import suggestions from "@/lib/sogp/podcast-suggestions.json";

import { SAMPLE_HUB } from "../learning-slim/sample";

/** Sample data for the guided tour mockup. Generic names only; nothing saves. */
export type TourPath = "sogp" | "podcast" | "doctrinal";
export type Arrival = "direct" | "link";

const DAY = 86_400_000;
const start = Date.now();
/** A day's calendar tile, as Learning shows it: "Sat" over "28". */
const dayParts = (offset: number) => { const date = new Date(start + offset * DAY); return { weekday: date.toLocaleDateString("en-GB", { weekday: "short", timeZone: "Africa/Lagos" }), day: date.toLocaleDateString("en-GB", { day: "numeric", timeZone: "Africa/Lagos" }) }; };

const podcastEpisodes = suggestions.suggested60EpisodeDefault.map(row => ({ guid: `yt:${row.videoId}`, title: row.title, duration: row.duration, audioUrl: "" }));
const teachings = [
  ["Faith & Growth", ["Understanding the Gospel", "Our Redemption in Christ", "Who We Are in Christ", "Our Fellowship with the Father", "The Ministry of Prayer"]],
  ["Gospel & Truth", ["Why You Should Not Be Afraid", "The Value of Redemption", "Growing in Commitment", "The Life of Devotion", "The Renewing of Your Mind"]],
  ["Kingdom Living", ["Seek First the Kingdom", "Walking in Love", "The Word in You", "Faith That Works", "Living by the Spirit"]],
] as const;
const library = teachings.flatMap(([series, titles], group) => titles.map((title, index) => ({ guid: `teaching:${group * 10 + index + 1}`, title, duration: "00:48:20", audioUrl: "", series })));

export function learningView(arrival: Arrival): LearningViewData {
  return {
    state: null, canWrite: true, writeBlockReason: null,
    episodes: [...podcastEpisodes, ...library],
    followUp: arrival === "link" ? { name: "Ada Okafor", source: "link", choice: null } : null,
    traditional: {
      completed: 0, total: 18, nextTitle: "Gospel: The Word of Truth", resumeHref: "#",
      levels: SOGP_LEVELS.map(level => ({ level: level.level, done: 0, open: level.level === 1,
        tracks: level.level === 4 ? [] : level.tracks.map((track, index) => ({ title: track.title, releaseAt: new Date(start + ((level.level - 1) * 7 + index) * DAY).toISOString() })) })),
    },
  };
}

const base: LearningHubData = { ...SAMPLE_HUB, cohortTitle: "SOGP November 2026", weekLabel: "Week 1 of 4", doneCount: 0, catchUp: null, review: null };

export const HUB: Record<TourPath | "none", LearningHubData> = {
  none: { ...base, path: null, state: "start", month: null, card: { ...base.card, level: 1 } },
  sogp: { ...base, path: "traditional", state: "active",
    card: { eyebrow: "Level 1", title: "Gospel: The Word of Truth", progress: "Track 1 of 18 · ready to start", done: 0, total: 18, href: "#", action: "Start today’s teaching", level: 1 },
    month: { name: new Date(start).toLocaleDateString("en-GB", { month: "long", timeZone: "Africa/Lagos" }), daysLeft: 30, rows: [0, 1, 2].map(day => ({ weekday: dayParts(day).weekday, day: dayParts(day).day, today: day === 0, title: SOGP_LEVELS[0]!.tracks[day]?.title ?? "Sample track", meta: `Level 1 · track ${day + 1}`, href: "#" })), note: "A track a day, with a group review at the end of each level.", empty: null } },
  podcast: { ...base, path: "podcast_two", state: "active",
    card: { eyebrow: "Episode 1 of 60", title: "The Reality of God’s Purpose", progress: "0 of 2 episodes today · 0 of 60 in your plan", done: 0, total: 60, href: "#", action: "Listen now", level: 1 },
    month: { name: new Date(start).toLocaleDateString("en-GB", { month: "long", timeZone: "Africa/Lagos" }), daysLeft: 30, rows: [0, 1, 2].map(day => ({ weekday: dayParts(day).weekday, day: dayParts(day).day, today: day === 0, title: "The Reality of God’s Purpose", meta: `Episodes ${day * 2 + 1} and ${day * 2 + 2}`, href: "#" })), note: "When your plan is done, SOGP follows from level 1.", empty: null } },
  doctrinal: { ...base, path: "doctrinal", state: "active",
    card: { eyebrow: "Teaching 1 of 5", title: "Understanding the Gospel", progress: "Faith & Growth · 0 of 5 teachings", done: 0, total: 5, href: "#", action: "Listen now", level: 1 },
    month: { name: new Date(start).toLocaleDateString("en-GB", { month: "long", timeZone: "Africa/Lagos" }), daysLeft: 30, rows: library.slice(0, 3).map((item, day) => ({ weekday: dayParts(day).weekday, day: dayParts(day).day, today: day === 0, title: item.title, meta: item.series, href: "#" })), note: "Add teachings from the Library at any time.", empty: null } },
};

/** The shared month from today to its end, one planned item a day (sample titles). */
function sampleMonth(todayKey: string, podcast: boolean): HomeSogp["month"] {
  const [year, month] = todayKey.split("-").map(Number) as [number, number];
  const length = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const today = Number(todayKey.slice(8));
  const key = todayKey.slice(0, 7);
  const days = Object.fromEntries(Array.from({ length }, (_, index) => {
    const day = index + 1, dateKey = `${key}-${String(day).padStart(2, "0")}`;
    const n = day - today + 1;
    return [dateKey, { dateKey, learning: n >= 1 ? { title: podcast ? `Sample episode ${n}` : `Sample track ${n}`, meta: podcast ? `Episode ${n}` : `Level 1 · track ${n}`, href: "#", done: false } : null, prayer: 0, bible: false }];
  }));
  return { key, name: new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-GB", { month: "long", timeZone: "UTC" }), todayKey, daysLeft: length - today + 1, daysSoFar: today, podcast, days };
}

const sampleInvite = { code: "SAM24", url: "https://pleros.org/sogp/enrol?ref=SAM24", joined: 0 };
/** This month's board, sample first names only. */
function sampleBoard(): NonNullable<DashboardHomeData["leaderboard"]> {
  const month = new Date(start).toLocaleDateString("en-GB", { month: "long", timeZone: "Africa/Lagos" });
  return { month, total: 162, points: 0, me: null, top: [
    { rank: 1, name: "Ada", points: 410, isMe: false }, { rank: 2, name: "Bola", points: 388, isMe: false }, { rank: 3, name: "Chuka", points: 352, isMe: false },
    { rank: 4, name: "Dami", points: 301, isMe: false }, { rank: 5, name: "Efe", points: 287, isMe: false },
  ] };
}

/** Home, before a path (Choose a learning path) and after one (today's steps). */
function sogpToday(path: TourPath): HomeSogp {
  const today = new Date(start).toISOString().slice(0, 10);
  const podcast = path !== "sogp";
  return {
    cohortTitle: "SOGP November 2026", weekLabel: "Week 1 of 4",
    today: {
      dateKey: today, dateLabel: new Date(start).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "Africa/Lagos" }), done: 0, total: podcast ? 2 : 3,
      teaching: { title: path === "sogp" ? "Gospel: The Word of Truth" : path === "podcast" ? "The Reality of God’s Purpose" : "Understanding the Gospel", href: "#", done: false, dayNumber: 1, podcast, questionGuid: null },
      prayerWatch: { complete: false },
      assessment: podcast ? null : { complete: false, href: "#" },
      review: null,
    },
    month: sampleMonth(today, podcast),
    progress: null, invite: null,
    group: { kind: "member", groupName: "Ada’s group", leaderFirstName: "Ada" },
    shareDayNumber: null,
  };
}

export function home(path: TourPath | null): DashboardHomeData {
  const learning = { title: "", href: "#", action: "", completed: 0, total: 0, enrolled: true };
  // A new learner's Home, as the real one: cohort and week, their group, invite and the month's board.
  if (!path) return { day: new Date(start).toISOString().slice(0, 10), reports: null, card: { kind: "start", href: "?screen=choose" }, sogp: { ...sogpToday("sogp"), today: null, month: null, invite: sampleInvite }, leaderboard: sampleBoard(), learning, welcomePack: { done: false } };
  const card: DashboardHomeData["card"] = path === "sogp"
    ? { kind: "traditional", title: "Gospel: The Word of Truth", href: "#", completed: 0, total: 18, level: 1 }
    : { kind: "podcast", doctrinal: path === "doctrinal", pace: path === "podcast" ? 2 : 1, href: "#", series: path === "podcast" ? "The Reality of God’s Purpose" : "Understanding the Gospel", dayNumber: 1,
      episodes: (path === "podcast" ? [1, 2] : [1]).map(part => ({ part: `Part ${part}`, duration: "15:33", durationSeconds: 933, positionSeconds: 0, listened: false })) };
  return { day: new Date(start).toISOString().slice(0, 10), reports: null, card, sogp: { ...sogpToday(path), invite: sampleInvite }, leaderboard: sampleBoard(), learning, welcomePack: { done: false } };
}
