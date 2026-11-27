import { dashboardFont, dashboardHeadingFont } from "@/components/dashboard/v3/font";
import styles from "@/components/dashboard/v3/dashboard.module.css";

import { SimpleLearning } from "./simple-learning";

export const metadata = { title: "Simpler Learning", robots: { index: false, follow: false } };

/** Mockup (user, 27 November): Learning and the SOGP page with the strips and tiles taken out. Sample data. */
export default function LearningSimplePreview() {
  return <div className={`${dashboardFont.className} ${dashboardFont.variable} ${dashboardHeadingFont.variable} ${styles.root} min-h-dvh bg-[var(--color-community-canvas,#f8f6f2)] [&_h1]:text-[21px] [&_h1]:leading-[28px] [&_h1]:font-medium`} data-dashboard-v3>
    <p className="px-4 py-2 text-xs text-(--color-text-muted)">Preview · sample data · nothing saved</p>
    <SimpleLearning />
  </div>;
}
