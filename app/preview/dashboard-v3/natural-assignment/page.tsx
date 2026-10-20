import { dashboardFont } from "@/components/dashboard/v3/font";
import styles from "@/components/dashboard/v3/dashboard.module.css";
import { NaturalAssignmentPreview } from "./preview";

export const metadata = { title: "Natural assignment mockup", robots: { index: false, follow: false } };

/** Pastor review, 20 October: the optional natural assignment report under Other reports. Sample data only. */
export default function NaturalAssignmentPage() {
  return <div className={`${dashboardFont.className} ${styles.root}`} data-dashboard-v3>
    <p className="px-4 py-2 text-xs text-(--color-text-muted)">Mockup · sample data · nothing saved</p>
    <NaturalAssignmentPreview />
  </div>;
}
