import Link from "next/link";

import { dashboardFont, dashboardHeadingFont } from "@/components/dashboard/v3/font";
import styles from "@/components/dashboard/v3/dashboard.module.css";
import { SogpPageMockup } from "@/components/sogp/learning/sogp-page-mockup";

export const metadata = { title: "SOGP page mockup", robots: { index: false, follow: false } };

// Reads searchParams on every request (Cache Components).
export const instant = false;

/** Mockup of the SOGP page the Learning card opens: `?certificate=ready` shows a finished learner. Nothing saves. */
export default async function SogpPagePreview({ searchParams }: { searchParams: Promise<{ certificate?: string }> }) {
  const ready = (await searchParams).certificate === "ready";
  const link = (label: string, href: string, on: boolean) => <Link href={href} className={on ? "font-medium text-(--color-community-ink)" : "underline"}>{label}</Link>;
  return <div className={`${dashboardFont.className} ${dashboardFont.variable} ${dashboardHeadingFont.variable} ${styles.root} min-h-dvh bg-[var(--color-community-canvas,#f8f6f2)]`} data-dashboard-v3>
    <div className="grid gap-1 px-4 py-2 text-xs text-(--color-text-muted)">
      <span>Mockup · SOGP page · sample data · nothing saved</span>
      <span className="flex gap-3">{link("Certificate not yet", "?", !ready)}{link("Certificate ready", "?certificate=ready", ready)}</span>
    </div>
    <div className="mx-auto w-full max-w-[640px] px-4 pt-[18px] pb-7 [&_h1]:text-[21px] [&_h1]:leading-[28px] [&_h1]:font-medium">
      <SogpPageMockup ready={ready} />
    </div>
  </div>;
}
