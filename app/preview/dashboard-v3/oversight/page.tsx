import { dashboardFont } from "@/components/dashboard/v3/font";
import styles from "@/components/dashboard/v3/dashboard.module.css";
import { OversightMockup } from "@/components/dashboard/church/oversight-mockup";

export const metadata = { title: "Oversight mockup", robots: { index: false, follow: false } };

// Reads searchParams on every request (Cache Components).
export const instant = false;

/** Pastor review, 20 October: Structure, Reports and Updates. Sample data only, nothing saved. */
export default async function OversightPreview({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const initial = tab === "reports" || tab === "updates" ? tab : "structure";
  return <div className={`${dashboardFont.className} ${styles.root}`} data-dashboard-v3>
    <p className="px-4 py-2 text-xs text-(--color-text-muted)">Mockup · sample data · nothing saved</p>
    <OversightMockup initialTab={initial} />
  </div>;
}
