import Link from "next/link";

import { MultiGroupMockup, type MultiGroupScreen } from "@/components/community/multi-group-mockup";
import { dashboardFont, dashboardHeadingFont } from "@/components/dashboard/v3/font";
import styles from "@/components/dashboard/v3/dashboard.module.css";

export const metadata = { title: "Multi-group membership mockup", robots: { index: false, follow: false } };

// Reads searchParams on every request (Cache Components).
export const instant = false;

const SCREENS: Record<MultiGroupScreen, string> = { invite: "1 Invite", home: "2 Groups you’re under", group: "3 Leave", question: "4 Question", oversight: "5 Oversight" };

/** Mockup of multi-group membership: `?screen=invite|home|group|question|oversight`. Nothing saves. */
export default async function MultiGroupPreview({ searchParams }: { searchParams: Promise<{ screen?: string }> }) {
  const raw = (await searchParams).screen;
  const screen: MultiGroupScreen = raw && raw in SCREENS ? raw as MultiGroupScreen : "invite";
  return <div className={`${dashboardFont.className} ${dashboardFont.variable} ${dashboardHeadingFont.variable} ${styles.root} min-h-dvh bg-[var(--color-community-canvas,#f8f6f2)] [&_h1]:text-[21px] [&_h1]:leading-[28px] [&_h1]:font-medium`} data-dashboard-v3>
    <div className="grid gap-1 px-4 py-2 text-xs text-(--color-text-muted)">
      <span>Mockup · multi-group membership · sample data · nothing saved</span>
      <span className="flex flex-wrap gap-x-3">{(Object.keys(SCREENS) as MultiGroupScreen[]).map(key => <Link key={key} href={`?screen=${key}`} className={key === screen ? "font-medium text-(--color-community-ink)" : "underline"}>{SCREENS[key]}</Link>)}</span>
    </div>
    <div className="mx-auto max-w-[640px]"><MultiGroupMockup key={screen} screen={screen} /></div>
  </div>;
}
