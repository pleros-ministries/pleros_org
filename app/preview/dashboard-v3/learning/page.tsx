import { dashboardFont } from "@/components/dashboard/v3/font";
import styles from "@/components/dashboard/v3/dashboard.module.css";
import { LearningPreview } from "@/components/sogp/learning/learning-preview";

// Reads searchParams on every request (Cache Components).
export const instant = false;

export const metadata = { title: "Learning visual preview", robots: { index: false, follow: false } };

/** screen: home-one | home-two | traditional | path | path-new | plan-one | plan-two | listen-one | listen-two */
export default async function LearningPreviewPage({ searchParams }: { searchParams: Promise<{ screen?: string }> }) {
  const { screen = "home-one" } = await searchParams;
  return <div className={`${dashboardFont.className} ${styles.root}`} data-dashboard-v3><p className="px-4 py-2 text-xs text-(--color-text-muted)">Visual preview · sample data · nothing saved</p><LearningPreview screen={screen} /></div>;
}
