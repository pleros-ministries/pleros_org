import Link from "next/link";

import { dashboardFont, dashboardHeadingFont } from "@/components/dashboard/v3/font";
import styles from "@/components/dashboard/v3/dashboard.module.css";
import { AskAfterTeachingPreview } from "@/components/sogp/ask-after-teaching-preview";

export const metadata = { title: "Ask after a teaching preview", robots: { index: false, follow: false } };

// Reads searchParams on every request (Cache Components).
export const instant = false;

/** The real question prompt after a teaching, in preview mode: `?leader=none` for someone with no leader. Nothing sends. */
export default async function AskAfterTeachingPage({ searchParams }: { searchParams: Promise<{ leader?: string }> }) {
  const noLeader = (await searchParams).leader === "none";
  const link = (label: string, href: string, on: boolean) => <Link href={href} className={on ? "font-medium text-(--color-community-ink)" : "underline"}>{label}</Link>;
  return <div className={`${dashboardFont.className} ${dashboardFont.variable} ${dashboardHeadingFont.variable} ${styles.root} min-h-dvh bg-[var(--color-community-canvas,#f8f6f2)]`} data-dashboard-v3>
    <div className="grid gap-1 px-4 py-2 text-xs text-(--color-text-muted)">
      <span>Preview · after a teaching · sample data · nothing sent</span>
      <span className="flex gap-3">{link("Has a leader", "?", !noLeader)}{link("No leader", "?leader=none", noLeader)}</span>
    </div>
    <div className="mx-auto w-full max-w-[640px] px-4 pt-[18px] pb-7 [&_h1]:text-[21px] [&_h1]:leading-[28px] [&_h1]:font-medium">
      <AskAfterTeachingPreview key={String(noLeader)} route={noLeader ? { kind: "ask-pleros" } : { kind: "discipler", leaderFirstName: "Tolu" }} />
    </div>
  </div>;
}
