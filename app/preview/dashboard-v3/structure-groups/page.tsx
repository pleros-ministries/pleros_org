import Link from "next/link";

import { dashboardFont, dashboardHeadingFont } from "@/components/dashboard/v3/font";
import styles from "@/components/dashboard/v3/dashboard.module.css";
import { StructureGroupsMockup } from "@/components/dashboard/church/structure-groups-mockup";

export const metadata = { title: "Structure as groups mockup", robots: { index: false, follow: false } };

// Reads searchParams on every request (Cache Components).
export const instant = false;

/** Mockup of Oversight Structure as groups with their leaders: `?screen=structure|group`. Nothing saves. */
export default async function StructureGroupsPreview({ searchParams }: { searchParams: Promise<{ screen?: string }> }) {
  const screen = (await searchParams).screen === "group" ? "group" : "structure";
  const link = (label: string, href: string, on: boolean) => <Link href={href} className={on ? "font-medium text-(--color-community-ink)" : "underline"}>{label}</Link>;
  return <div className={`${dashboardFont.className} ${dashboardFont.variable} ${dashboardHeadingFont.variable} ${styles.root} min-h-dvh bg-[var(--color-community-canvas,#f8f6f2)]`} data-dashboard-v3>
    <div className="grid gap-1 px-4 py-2 text-xs text-(--color-text-muted)">
      <span>Mockup · Structure as groups · sample data · nothing saved</span>
      <span className="flex gap-3">{link("1 Structure", "?screen=structure", screen === "structure")}{link("2 A group under you", "?screen=group", screen === "group")}</span>
    </div>
    <div className="mx-auto w-full max-w-[640px] px-4 pt-[18px] pb-7 [&_h1]:text-[21px] [&_h1]:leading-[28px] [&_h1]:font-medium">
      <StructureGroupsMockup key={screen} screen={screen} />
    </div>
  </div>;
}
