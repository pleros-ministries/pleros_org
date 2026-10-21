import { dashboardFont, dashboardHeadingFont } from "@/components/dashboard/v3/font";
import styles from "@/components/dashboard/v3/dashboard.module.css";
import { LearningHub } from "@/components/sogp/learning/learning-hub";
import type { LearningViewData } from "@/lib/sogp/learning-view";

import { SAMPLE_HUB } from "./sample";

export const metadata = { title: "Learning preview", robots: { index: false, follow: false } };

/** The real Learning page on sample data. Nothing saves. */
export default function LearningSlimPreview() {
  return <div className={`${dashboardFont.className} ${dashboardFont.variable} ${dashboardHeadingFont.variable} ${styles.root} min-h-dvh bg-[var(--color-community-canvas,#f8f6f2)] [&_h1]:text-[21px] [&_h1]:leading-[28px] [&_h1]:font-medium`} data-dashboard-v3>
    <p className="px-4 py-2 text-xs text-(--color-text-muted)">Preview · Learning · sample data · nothing saved</p>
    <LearningHub hub={SAMPLE_HUB} learning={{ followUp: null } as unknown as LearningViewData} />
  </div>;
}
