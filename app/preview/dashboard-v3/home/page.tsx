import { dashboardFont } from "@/components/dashboard/v3/font";
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
  traditional: { kind: "traditional", title: "Track 03", href: "#", completed: 2, total: 28 },
  "podcast-two": { kind: "podcast", pace: 2, href: "#", series: "The Reality of God’s Purpose", dayNumber: 1, episodes: [{ part: "Part 1", duration: "15:33", durationSeconds: 933, positionSeconds: 0, listened: true }, { part: "Part 2", duration: "14:13", durationSeconds: 853, positionSeconds: 285, listened: false }] },
  "podcast-one": { kind: "podcast", pace: 1, href: "#", series: "The Reality of God’s Purpose", dayNumber: 3, episodes: [{ part: "Part 3", duration: "13:34", durationSeconds: 814, positionSeconds: 480, listened: false }] },
};

/** Labelled sample data only. */
export default async function HomePreview({ searchParams }: { searchParams: Promise<{ card?: string }> }) {
  const { card = "start" } = await searchParams;
  const data: DashboardHomeData = { day: "2026-10-13", community: true, reports, support: { firstName: "Efe", canMessage: true }, card: cards[card] ?? cards.start,
    learning: { title: "", href: "#", action: "", completed: 0, total: 0, enrolled: card !== "start" } };
  return <div className={`${dashboardFont.className} ${styles.root}`} data-dashboard-v3><p className="px-4 py-2 text-xs text-(--color-text-muted)">Visual preview · sample data · nothing saved</p><DashboardHomeView name="Tolu" greeting="Good morning" data={data} /></div>;
}
