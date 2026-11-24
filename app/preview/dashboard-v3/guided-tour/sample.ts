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
const dayMonth = (offset: number) => new Date(start + offset * DAY).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Africa/Lagos" });

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
  none: { ...base, path: null, state: "start", summary: null, card: { ...base.card, level: 1 } },
  sogp: { ...base, path: "traditional", state: "active",
    card: { eyebrow: "Level 1", title: "Gospel: The Word of Truth", progress: "Track 1 of 18 · ready to start", done: 0, total: 18, href: "#", action: "Start today’s teaching", level: 1 },
    summary: { counts: [{ label: "Tracks", value: "18" }, { label: "Levels", value: "3" }, { label: "Done by", value: dayMonth(20) }], listTitle: "Levels",
      rows: [1, 2, 3].map(level => ({ title: `Level ${level}`, meta: `6 tracks · ${dayMonth((level - 1) * 7)}–${dayMonth((level - 1) * 7 + 5)}`, end: level === 1 ? "Now" : null, href: "#", muted: false }))
        .concat([{ title: "Level 4", meta: "6 tracks · Coming soon", end: null, href: null as never, muted: true }, { title: "Advanced SOGP", meta: "After level 4", end: null, href: null as never, muted: true }]),
      more: null, note: "A track a day, with a group review at the end of each level.", empty: null } },
  podcast: { ...base, path: "podcast_two", state: "active",
    card: { eyebrow: "Day 1", title: "The Reality of God’s Purpose", progress: "0 of 2 episodes today · 0 of 60 in your plan", done: 0, total: 60, href: "#", action: "Listen to day 1", level: 1 },
    summary: { counts: [{ label: "Episodes", value: "60" }, { label: "Days left", value: "30" }, { label: "Done by", value: dayMonth(29) }], listTitle: "Coming up",
      rows: [0, 1, 2].map(day => ({ title: "The Reality of God’s Purpose", meta: `Day ${day + 1} · 2 episodes`, end: dayMonth(day), href: "#", muted: false })),
      more: { label: "See all 30", href: "#" }, note: "When your plan is done, SOGP follows from level 1.", empty: null } },
  doctrinal: { ...base, path: "doctrinal", state: "active",
    card: { eyebrow: "Day 1", title: "Understanding the Gospel", progress: "Faith & Growth · 0 of 5 teachings", done: 0, total: 5, href: "#", action: "Listen to day 1", level: 1 },
    summary: { counts: [{ label: "Teachings", value: "5" }, { label: "Days left", value: "5" }, { label: "Done by", value: dayMonth(4) }], listTitle: "Coming up",
      rows: library.slice(0, 3).map((item, day) => ({ title: item.title, meta: `Day ${day + 1} · ${item.series}`, end: dayMonth(day), href: "#", muted: false })),
      more: { label: "See all 5", href: "#" }, note: "Add teachings from the Library at any time.", empty: null } },
};

/** Home, before a path (Choose a learning path) and after one (today's steps). */
function sogpToday(path: TourPath): HomeSogp {
  const today = new Date(start).toISOString().slice(0, 10);
  const podcast = path !== "sogp";
  return {
    cohortTitle: "SOGP November 2026", weekLabel: "Week 1 of 4",
    today: {
      dateKey: today, dateLabel: new Date(start).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "Africa/Lagos" }), done: 0, total: podcast ? 2 : 3, ended: null,
      sogpDays: Array.from({ length: 28 }, (_, index) => {
        const dateKey = new Date(start + index * DAY).toISOString().slice(0, 10);
        return { number: index + 1, dateKey, weekday: new Date(start + index * DAY).toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" }), dayOfMonth: Number(dateKey.slice(8)), state: index === 0 ? "today" as const : "later" as const, review: (index + 1) % 7 === 0,
          detail: { teaching: (index + 1) % 7 === 0 ? null : { title: `Day ${index + 1}`, href: null, listened: false, assessed: false }, prayed: false, reviewTitle: (index + 1) % 7 === 0 ? `Week ${(index + 1) / 7} group review` : null } };
      }),
      dayNumber: 1,
      teaching: { title: path === "sogp" ? "Gospel: The Word of Truth" : path === "podcast" ? "The Reality of God’s Purpose · day 1" : "Understanding the Gospel · day 1", href: "#", done: false, dayNumber: 1, podcast, questionGuid: null },
      prayerWatch: { complete: false },
      assessment: podcast ? null : { complete: false, href: "#" },
      review: null,
    },
    progress: null, leaderboard: null, invite: null, board: null,
    group: { kind: "member", groupName: "Ada’s group", leaderFirstName: "Ada" },
    shareDayNumber: null,
  };
}

export function home(path: TourPath | null): DashboardHomeData {
  const learning = { title: "", href: "#", action: "", completed: 0, total: 0, enrolled: true };
  if (!path) return { day: new Date(start).toISOString().slice(0, 10), reports: null, card: { kind: "start", href: "?screen=choose" }, sogp: null, learning, welcomePack: { done: false } };
  const card: DashboardHomeData["card"] = path === "sogp"
    ? { kind: "traditional", title: "Gospel: The Word of Truth", href: "#", completed: 0, total: 18, level: 1 }
    : { kind: "podcast", doctrinal: path === "doctrinal", pace: path === "podcast" ? 2 : 1, href: "#", series: path === "podcast" ? "The Reality of God’s Purpose" : "Understanding the Gospel", dayNumber: 1,
      episodes: (path === "podcast" ? [1, 2] : [1]).map(part => ({ part: `Part ${part}`, duration: "15:33", durationSeconds: 933, positionSeconds: 0, listened: false })) };
  return { day: new Date(start).toISOString().slice(0, 10), reports: null, card, sogp: sogpToday(path), learning, welcomePack: { done: false } };
}
