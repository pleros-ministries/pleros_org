import { dashboardFont, dashboardHeadingFont } from "@/components/dashboard/v3/font";
import styles from "@/components/dashboard/v3/dashboard.module.css";
import hubStyles from "@/components/sogp/learning/learning-hub.module.css";
import { SogpPageMockup } from "@/components/sogp/learning/sogp-page-mockup";

export const metadata = { title: "SOGP page mockup", robots: { index: false, follow: false } };

/** Mockup of the SOGP page, designed. Sample data; nothing saves. */
export default function SogpPagePreview() {
  return <div className={`${dashboardFont.className} ${dashboardFont.variable} ${dashboardHeadingFont.variable} ${styles.root} min-h-dvh bg-[var(--color-community-canvas,#f8f6f2)]`} data-dashboard-v3>
    <p className="px-4 py-2 text-xs text-(--color-text-muted)">Mockup · SOGP page · sample data · nothing saved</p>
    <div className={hubStyles.page}><div className={hubStyles.column}><SogpPageMockup /></div></div>
  </div>;
}
