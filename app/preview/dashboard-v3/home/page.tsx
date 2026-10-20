import { dashboardFont, dashboardHeadingFont } from "@/components/dashboard/v3/font";
import styles from "@/components/dashboard/v3/dashboard.module.css";
import { DashboardHomeView } from "@/components/dashboard/v3/home-view";
import type { DashboardHomeData } from "@/lib/dashboard/home";

export const metadata = { title: "You home visual preview", robots: { index: false, follow: false } };

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
    dateKey: "2026-10-16", dateLabel: "Friday 16 October", done: 1, total: 2,
    week: ([["2026-10-12", "Mon", "complete"], ["2026-10-13", "Tue", "complete"], ["2026-10-14", "Wed", "missed"], ["2026-10-15", "Thu", "complete"], ["2026-10-16", "Fri", "current"], ["2026-10-17", "Sat", "future"], ["2026-10-18", "Sun", "future"]] as const)
      .map(([dateKey, weekday, state]) => ({ dateKey, weekday, dayOfMonth: Number(dateKey.slice(8)), state, isToday: state === "current", hasReview: weekday === "Sun" })),
    prayerWatch: { complete: true },
    review: { title: "Level 2 group review", when: "Sunday 18 October", href: null, complete: false },
  },
  progress: { learningLabel: "Teachings", learningDone: 10, learningTotal: 24, prayerPercent: 83, prayerRequired: 80, reviewsSatisfied: 1, reviewsOwed: 4, checksPassed: 2 },
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
