import { dashboardFont, dashboardHeadingFont } from "@/components/dashboard/v3/font";
import styles from "@/components/dashboard/v3/dashboard.module.css";
import { ReportYesNoMockup } from "@/components/community/report/report-yes-no-mockup";

export const metadata = { title: "My reports mockup", robots: { index: false, follow: false } };

/** Mockup of My reports after the Pastor's 21 October review. Nothing saves. */
export default function ReportYesNoPreview() {
  return <div className={`${dashboardFont.className} ${dashboardFont.variable} ${dashboardHeadingFont.variable} ${styles.root} min-h-dvh bg-[var(--color-community-canvas,#f8f6f2)]`} data-dashboard-v3>
    <p className="px-4 py-2 text-xs text-(--color-text-muted)">Mockup · My reports · sample data · nothing saved</p>
    <div className="mx-auto w-full max-w-[640px] px-4 pt-[18px] pb-7 [&_h1]:text-[21px] [&_h1]:leading-[28px] [&_h1]:font-medium">
      <ReportYesNoMockup />
    </div>
  </div>;
}
