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
    dateKey: "2026-10-21", dateLabel: "Wednesday 21 October", done: 1, total: 3, ended: null,
    // 28 SOGP days from Monday 12 October; today is day 10, day 4 was missed.
    sogpDays: Array.from({ length: 28 }, (_, index) => {
      const dateKey = new Date(Date.UTC(2026, 9, 12 + index)).toISOString().slice(0, 10);
      const number = index + 1;
      return { number, dateKey, weekday: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index % 7]!, dayOfMonth: Number(dateKey.slice(8)), state: number === 10 ? "today" as const : number === 4 ? "missed" as const : number < 10 ? "done" as const : "later" as const, review: number % 7 === 0 };
    }),
    dayNumber: 10,
    teaching: { title: "Biblical Origin and Ontology", href: "#", done: false, dayNumber: 10, podcast: false, questionGuid: "sogp-lesson-preview" },
    prayerWatch: { complete: true },
    assessment: { complete: false, href: "#" },
    review: { title: "Level 2 group review", when: "Sunday 25 October", href: null, complete: false },
  },
  progress: { teaching: { done: 9, total: 24, unit: "days" }, prayer: { percent: 64, required: 80 }, assessment: { done: 8, total: 9 } },
  leaderboard: { rank: 7, points: 240 },
  invite: { code: "a1b2c3d4", url: "https://pleros.org/sogp?ref=a1b2c3d4", joined: 3 },
  board: { total: 162, me: { rank: 7, points: 240 }, top: [
    { rank: 1, name: "Ada O.", points: 410, isMe: false }, { rank: 2, name: "Bola K.", points: 388, isMe: false }, { rank: 3, name: "Chuka E.", points: 352, isMe: false },
    { rank: 4, name: "Dami A.", points: 301, isMe: false }, { rank: 5, name: "Efe T.", points: 287, isMe: false },
  ] },
  group: { kind: "member", groupName: "SOGP Discipleship Group", leaderFirstName: "Ada" },
  shareDayNumber: null,
};

/** Labelled sample data only. */
export default async function HomePreview({ searchParams }: { searchParams: Promise<{ card?: string }> }) {
  const { card = "start" } = await searchParams;
  const data: DashboardHomeData = { day: "2026-10-16", reports, card: cards[card] ?? cards.start, sogp: card === "start" ? null : sogp,
    learning: { title: "", href: "#", action: "", completed: 0, total: 0, enrolled: card !== "start" } };
  return <div className={`${dashboardFont.className} ${dashboardHeadingFont.variable} ${styles.root}`} data-dashboard-v3><p className="px-4 py-2 text-xs text-(--color-text-muted)">Visual preview · sample data · nothing saved</p><DashboardHomeView name="Tolu" greeting="Good morning" data={data} /></div>;
}
