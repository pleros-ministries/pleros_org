import Link from "next/link";

import { dashboardFont, dashboardHeadingFont } from "@/components/dashboard/v3/font";
import styles from "@/components/dashboard/v3/dashboard.module.css";
import { ReportYesNoMockup } from "@/components/community/report/report-yes-no-mockup";

export const metadata = { title: "My reports mockup", robots: { index: false, follow: false } };

// Reads searchParams on every request (Cache Components).
export const instant = false;

/** Venues someone has saved before (`?venues=1`); without it, it's their first meeting. */
const SAMPLE_VENUES = ["Church hall", "Online (Zoom)", "Yaba campus"];

/** Mockup of My reports after the Pastor's 21 October review. Nothing saves. */
export default async function ReportYesNoPreview({ searchParams }: { searchParams: Promise<{ venues?: string }> }) {
  const used = (await searchParams).venues === "1";
  const link = (label: string, href: string, on: boolean) => <Link href={href} className={on ? "font-medium text-(--color-community-ink)" : "underline"}>{label}</Link>;
  return <div className={`${dashboardFont.className} ${dashboardFont.variable} ${dashboardHeadingFont.variable} ${styles.root} min-h-dvh bg-[var(--color-community-canvas,#f8f6f2)]`} data-dashboard-v3>
    <div className="grid gap-1 px-4 py-2 text-xs text-(--color-text-muted)">
      <span>Mockup · My reports · sample data · nothing saved</span>
      <span className="flex flex-wrap gap-x-3">{link("No venues yet", "?", !used)}{link("Has used venues", "?venues=1", used)}</span>
    </div>
    <div className="mx-auto w-full max-w-[640px] px-4 pt-[18px] pb-7 [&_h1]:text-[21px] [&_h1]:leading-[28px] [&_h1]:font-medium">
      <ReportYesNoMockup key={String(used)} startingVenues={used ? SAMPLE_VENUES : []} />
    </div>
  </div>;
}
