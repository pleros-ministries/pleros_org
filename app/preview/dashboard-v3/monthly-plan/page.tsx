import Link from "next/link";

import { MonthView } from "@/components/dashboard/month/month-view";
import { dashboardFont, dashboardHeadingFont } from "@/components/dashboard/v3/font";
import styles from "@/components/dashboard/v3/dashboard.module.css";

import { decemberSample, novemberSample } from "./sample";

export const metadata = { title: "This month preview", robots: { index: false, follow: false } };

// Reads searchParams on every request (Cache Components).
export const instant = false;

const SCREENS = { november: "25 November", december: "1 December" } as const;
type Screen = keyof typeof SCREENS;

/** The real month page (`/dashboard/sogp/month`) on sample data, for checking without signing in. */
export default async function MonthPreview({ searchParams }: { searchParams: Promise<{ screen?: string }> }) {
  const query = await searchParams;
  const screen: Screen = query.screen === "december" ? "december" : "november";
  const data = screen === "december" ? decemberSample() : novemberSample();
  return <div className={`${dashboardFont.className} ${dashboardFont.variable} ${dashboardHeadingFont.variable} ${styles.root} min-h-dvh bg-[var(--color-community-canvas,#f8f6f2)] [&_h1]:text-[21px] [&_h1]:leading-[28px] [&_h1]:font-medium`} data-dashboard-v3>
    <div className="mx-auto flex max-w-[640px] flex-wrap gap-x-3 gap-y-1 px-4 pt-3 text-xs text-(--color-text-muted)">
      <span>Preview · this month · sample data · nothing saved</span>
      {(Object.keys(SCREENS) as Screen[]).map(key => <Link key={key} href={`?screen=${key}`} className={key === screen ? "font-medium text-(--color-community-ink)" : "underline"}>{SCREENS[key]}</Link>)}
    </div>
    <MonthView key={screen} data={data} />
  </div>;
}
