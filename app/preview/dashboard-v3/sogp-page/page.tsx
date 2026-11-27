import { dashboardFont, dashboardHeadingFont } from "@/components/dashboard/v3/font";
import styles from "@/components/dashboard/v3/dashboard.module.css";
import { SogpSchool } from "@/components/sogp/learning/sogp-school";

import { SAMPLE_FACTS, SAMPLE_HUB } from "../learning-slim/sample";

export const metadata = { title: "SOGP page preview", robots: { index: false, follow: false } };

/** The real SOGP page on sample data. Nothing saves. */
export default function SogpPagePreview() {
  return <div className={`${dashboardFont.className} ${dashboardFont.variable} ${dashboardHeadingFont.variable} ${styles.root} min-h-dvh bg-[var(--color-community-canvas,#f8f6f2)] [&_h1]:text-[21px] [&_h1]:leading-[28px] [&_h1]:font-medium`} data-dashboard-v3>
    <p className="px-4 py-2 text-xs text-(--color-text-muted)">Preview · SOGP page · sample data · nothing saved</p>
    <SogpSchool hub={SAMPLE_HUB} facts={SAMPLE_FACTS} followUp={null} />
  </div>;
}
