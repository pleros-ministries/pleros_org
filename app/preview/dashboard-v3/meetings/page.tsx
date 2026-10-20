import { dashboardFont } from "@/components/dashboard/v3/font";
import styles from "@/components/dashboard/v3/dashboard.module.css";
import { MeetingPreview } from "@/components/community/report/ministry-v3/meeting-preview";

// Reads searchParams on every request (Cache Components).
export const instant = false;

export const metadata = { title: "Meeting report visual preview", robots: { index: false, follow: false } };

export default async function MeetingsPreviewPage({ searchParams }: { searchParams: Promise<{ screen?: string }> }) {
  const { screen = "select" } = await searchParams;
  return <div className={`${dashboardFont.className} ${styles.root}`} data-dashboard-v3><p className="px-4 py-2 text-xs text-(--color-text-muted)">Visual preview · sample data · nothing saved</p><MeetingPreview screen={screen} /></div>;
}
