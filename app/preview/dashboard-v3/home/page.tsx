import { dashboardFont, dashboardHeadingFont } from "@/components/dashboard/v3/font";
import styles from "@/components/dashboard/v3/dashboard.module.css";
import { DashboardHomeView } from "@/components/dashboard/v3/home-view";
import type { DashboardHomeData } from "@/lib/dashboard/home";

export const metadata = { title: "You home visual preview", robots: { index: false, follow: false } };

// Reads searchParams on every request (Cache Components).
export const instant = false;

const reports: DashboardHomeData["reports"] = [
  { category: "devotional", title: "Devotional", description: "3 activities logged", status: "Not confirmed", tone: "amber" },
  { category: "ministry", title: "Ministry", description: "No report submitted", status: "Not reported", tone: "neutral" },
  { category: "meetings", title: "Meetings", description: "1 meeting recorded", status: "Reported", tone: "green" },
];
const cards: Record<string, DashboardHomeData["card"]> = {
  start: { kind: "start", href: "/dashboard/sogp/path" },
  traditional: { kind: "traditional", title: "Track 03", href: "#", completed: 2, total: 28, level: 1 },
  "level-2": { kind: "traditional", title: "The Godhead", href: "#", completed: 8, total: 24, level: 2 },
  "level-3": { kind: "traditional", title: "The Walk of Faith", href: "#", completed: 15, total: 24, level: 3 },
  "level-4": { kind: "traditional", title: "Natural Assignment", href: "#", completed: 21, total: 24, level: 4 },
  "podcast-two": { kind: "podcast", pace: 2, href: "#", series: "The Reality of God’s Purpose", dayNumber: 1, episodes: [{ part: "Part 1", duration: "15:33", durationSeconds: 933, positionSeconds: 0, listened: true }, { part: "Part 2", duration: "14:13", durationSeconds: 853, positionSeconds: 285, listened: false }] },
  "podcast-one": { kind: "podcast", pace: 1, href: "#", series: "The Reality of God’s Purpose", dayNumber: 3, episodes: [{ part: "Part 3", duration: "13:34", durationSeconds: 814, positionSeconds: 480, listened: false }] },
};

const sogp: DashboardHomeData["sogp"] = {
  cohortTitle: "SOGP October 2026",
  weekLabel: "Week 2 of 4",
  today: {
    dateKey: "2026-10-21", dateLabel: "Wednesday 21 October", done: 1, total: 3,
    teaching: { title: "Biblical Origin and Ontology", href: "#", done: false, dayNumber: 10, podcast: false, questionGuid: "sogp-lesson-preview" },
    prayerWatch: { complete: true },
    assessment: { complete: false, href: "#" },
    review: { title: "Level 2 group review", when: "Sunday 25 October", href: null, complete: false },
  },
  // The shared month: October so far, then the plan a track a day (sample titles).
  month: { key: "2026-10", name: "October", todayKey: "2026-10-21", daysLeft: 11, daysSoFar: 21, podcast: false, days: Object.fromEntries(Array.from({ length: 31 }, (_, index) => {
    const dateKey = `2026-10-${String(index + 1).padStart(2, "0")}`;
    const day = index + 1;
    const learnt = day >= 12 && day < 21 && day !== 15;
    return [dateKey, { dateKey, learning: day >= 12 ? { title: `Sample teaching ${day - 11}`, meta: `Level ${Math.ceil((day - 11) / 6)} · track ${day - 11}`, href: "#", done: learnt } : null, prayer: day < 21 && day % 3 ? 1 : day === 21 ? 1 : 0, bible: day < 21 && day % 2 === 0 }];
  })) },
  progress: { teaching: { done: 9, total: 24, unit: "days" }, prayer: { percent: 64, required: 80 }, assessment: { done: 8, total: 9 } },
  invite: { code: "a1b2c3d4", url: "https://pleros.org/sogp?ref=a1b2c3d4", joined: 3 },
  group: { kind: "member", groupName: "SOGP Discipleship Group", leaderFirstName: "Ada" },
  shareDayNumber: null,
};

/** This month's board for everyone (sample first names only). */
const leaderboard: DashboardHomeData["leaderboard"] = { month: "October", total: 162, points: 240, me: { rank: 7, points: 240 }, top: [
  { rank: 1, name: "Ada", points: 410, isMe: false }, { rank: 2, name: "Bola", points: 388, isMe: false }, { rank: 3, name: "Chuka", points: 352, isMe: false },
  { rank: 4, name: "Dami", points: 301, isMe: false }, { rank: 5, name: "Efe", points: 287, isMe: false },
] };

/** Labelled sample data only. */
export default async function HomePreview({ searchParams }: { searchParams: Promise<{ card?: string }> }) {
  const { card = "start" } = await searchParams;
  const data: DashboardHomeData = { day: "2026-10-16", reports, card: cards[card] ?? cards.start, sogp: card === "start" ? null : sogp, leaderboard,
    learning: { title: "", href: "#", action: "", completed: 0, total: 0, enrolled: card !== "start" } };
  return <div className={`${dashboardFont.className} ${dashboardHeadingFont.variable} ${styles.root}`} data-dashboard-v3><p className="px-4 py-2 text-xs text-(--color-text-muted)">Visual preview · sample data · nothing saved</p><DashboardHomeView name="Tolu" greeting="Good morning" data={data} /></div>;
}
