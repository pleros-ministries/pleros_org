import Link from "next/link";

import { dashboardFont, dashboardHeadingFont } from "@/components/dashboard/v3/font";
import styles from "@/components/dashboard/v3/dashboard.module.css";
import { NextLearningMockup } from "@/components/sogp/next-learning-mockup";

export const metadata = { title: "Next learning mockup", robots: { index: false, follow: false } };

// Reads searchParams on every request (Cache Components).
export const instant = false;

/** Mockup of choosing the next phase after SOGP: `?screen=learning|choose|chosen`. Nothing saves. */
export default async function NextLearningPreview({ searchParams }: { searchParams: Promise<{ screen?: string }> }) {
  const raw = (await searchParams).screen;
  const screen = raw === "choose" || raw === "chosen" ? raw : "learning";
  const link = (label: string, href: string, on: boolean) => <Link href={href} className={on ? "font-medium text-(--color-community-ink)" : "underline"}>{label}</Link>;
  return <div className={`${dashboardFont.className} ${dashboardFont.variable} ${dashboardHeadingFont.variable} ${styles.root} min-h-dvh bg-[var(--color-community-canvas,#f8f6f2)]`} data-dashboard-v3>
    <div className="grid gap-1 px-4 py-2 text-xs text-(--color-text-muted)">
      <span>Mockup · after SOGP · sample data · nothing saved</span>
      <span className="flex flex-wrap gap-x-3">{link("1 Finished", "?screen=learning", screen === "learning")}{link("2 Choose", "?screen=choose", screen === "choose")}{link("3 Chosen", "?screen=chosen", screen === "chosen")}</span>
    </div>
    <div className="mx-auto w-full max-w-[640px] px-4 pt-[18px] pb-7 [&_h1]:text-[21px] [&_h1]:leading-[28px] [&_h1]:font-medium">
      <NextLearningMockup key={screen} screen={screen} />
    </div>
  </div>;
}
