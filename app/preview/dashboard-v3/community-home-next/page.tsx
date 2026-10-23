import Link from "next/link";

import { CommunityHomeMockup } from "@/components/community/community-home-mockup";
import { dashboardFont, dashboardHeadingFont } from "@/components/dashboard/v3/font";
import styles from "@/components/dashboard/v3/dashboard.module.css";

export const metadata = { title: "Community Home mockup", robots: { index: false, follow: false } };

// Reads searchParams on every request (Cache Components).
export const instant = false;

/** Mockup of Community Home after the 22 October review: `?screen=home|group`. Nothing saves. */
export default async function CommunityHomeNextPreview({ searchParams }: { searchParams: Promise<{ screen?: string }> }) {
  const screen = (await searchParams).screen === "group" ? "group" : "home";
  const link = (label: string, href: string, on: boolean) => <Link href={href} className={on ? "font-medium text-(--color-community-ink)" : "underline"}>{label}</Link>;
  return <div className={`${dashboardFont.className} ${dashboardFont.variable} ${dashboardHeadingFont.variable} ${styles.root} min-h-dvh bg-[var(--color-community-canvas,#f8f6f2)]`} data-dashboard-v3>
    <div className="grid gap-1 px-4 py-2 text-xs text-(--color-text-muted)">
      <span>Mockup · Community Home · sample data · nothing saved</span>
      <span className="flex gap-3">{link("1 Home", "?screen=home", screen === "home")}{link("2 A group's breadcrumb", "?screen=group", screen === "group")}</span>
    </div>
    <CommunityHomeMockup key={screen} screen={screen} />
  </div>;
}
