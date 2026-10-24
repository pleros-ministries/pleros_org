import Link from "next/link";

import { LocationOptInMockup } from "@/components/community/location-optin-mockup";
import { dashboardFont, dashboardHeadingFont } from "@/components/dashboard/v3/font";
import styles from "@/components/dashboard/v3/dashboard.module.css";

export const metadata = { title: "Location groups opt-in mockup", robots: { index: false, follow: false } };

// Reads searchParams on every request (Cache Components).
export const instant = false;

/** Mockup of opt-in location groups: `?screen=home|invite|joined`. Nothing saves. */
export default async function LocationOptInPreview({ searchParams }: { searchParams: Promise<{ screen?: string }> }) {
  const raw = (await searchParams).screen;
  const screen = raw === "invite" || raw === "joined" ? raw : "home";
  const link = (label: string, href: string, on: boolean) => <Link href={href} className={on ? "font-medium text-(--color-community-ink)" : "underline"}>{label}</Link>;
  return <div className={`${dashboardFont.className} ${dashboardFont.variable} ${dashboardHeadingFont.variable} ${styles.root} min-h-dvh bg-[var(--color-community-canvas,#f8f6f2)] [&_h1]:text-[21px] [&_h1]:leading-[28px] [&_h1]:font-medium`} data-dashboard-v3>
    <div className="grid gap-1 px-4 py-2 text-xs text-(--color-text-muted)">
      <span>Mockup · location groups opt-in · sample data · nothing saved</span>
      <span className="flex flex-wrap gap-x-3">{link("1 Community Home", "?screen=home", screen === "home")}{link("2 Before you join", "?screen=invite", screen === "invite")}{link("3 After you join", "?screen=joined", screen === "joined")}</span>
    </div>
    <div className="mx-auto max-w-[640px]"><LocationOptInMockup key={screen} screen={screen} /></div>
  </div>;
}
