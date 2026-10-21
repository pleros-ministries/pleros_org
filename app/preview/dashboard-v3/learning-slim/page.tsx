import { dashboardFont, dashboardHeadingFont } from "@/components/dashboard/v3/font";
import styles from "@/components/dashboard/v3/dashboard.module.css";
import { LearningSlimMockup } from "@/components/sogp/learning/learning-slim-mockup";

export const metadata = { title: "Learning mockup", robots: { index: false, follow: false } };

/** Mockup of the slimmed Learning page; the SOGP card opens the SOGP page mockup. Nothing saves. */
export default function LearningSlimPreview() {
  return <div className={`${dashboardFont.className} ${dashboardFont.variable} ${dashboardHeadingFont.variable} ${styles.root} min-h-dvh bg-[var(--color-community-canvas,#f8f6f2)]`} data-dashboard-v3>
    <p className="px-4 py-2 text-xs text-(--color-text-muted)">Mockup · Learning · sample data · nothing saved</p>
    <div className="mx-auto w-full max-w-[640px] px-4 pt-[18px] pb-7 [&_h1]:text-[21px] [&_h1]:leading-[28px] [&_h1]:font-medium">
      <LearningSlimMockup />
    </div>
  </div>;
}
