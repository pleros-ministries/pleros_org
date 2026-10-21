import Link from "next/link";

import { dashboardFont, dashboardHeadingFont } from "@/components/dashboard/v3/font";
import styles from "@/components/dashboard/v3/dashboard.module.css";
import { HomeTodayMockup } from "@/components/dashboard/v3/home-today-mockup";

export const metadata = { title: "You Home mockup", robots: { index: false, follow: false } };

// Reads searchParams on every request (Cache Components).
export const instant = false;

/** Mockup of You Home after the Pastor's 21 October review: `?path=podcast` for the podcast path. Nothing saves. */
export default async function HomeTodayPreview({ searchParams }: { searchParams: Promise<{ path?: string }> }) {
  const podcast = (await searchParams).path === "podcast";
  const link = (label: string, href: string, on: boolean) => <Link href={href} className={on ? "font-medium text-(--color-community-ink)" : "underline"}>{label}</Link>;
  return <div className={`${dashboardFont.className} ${dashboardHeadingFont.variable} ${styles.root}`} data-dashboard-v3>
    <div className="grid gap-1 px-4 py-2 text-xs text-(--color-text-muted)">
      <span>Mockup · You Home · sample data · nothing saved</span>
      <span className="flex gap-3">{link("Traditional path", "?", !podcast)}{link("Podcast path", "?path=podcast", podcast)}</span>
    </div>
    <HomeTodayMockup key={String(podcast)} podcast={podcast} />
  </div>;
}
