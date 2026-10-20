import Link from "next/link";

import { dashboardFont, dashboardHeadingFont } from "@/components/dashboard/v3/font";
import styles from "@/components/dashboard/v3/dashboard.module.css";
import { NewGroupMockup } from "@/components/community/groups/new-group-mockup";

export const metadata = { title: "New group preview", robots: { index: false, follow: false } };

// Reads searchParams on every request (Cache Components).
export const instant = false;

/** Mockup of the New group page (`?view=now` shows today's behaviour). Nothing saves. */
export default async function NewGroupPreview({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const view = (await searchParams).view === "now" ? "now" : "proposed";
  return <div className={`${dashboardFont.className} ${dashboardFont.variable} ${dashboardHeadingFont.variable} ${styles.root} min-h-dvh bg-[var(--color-community-canvas,#f8f6f2)]`} data-dashboard-v3>
    <div className="flex items-center justify-between gap-3 px-4 py-2 text-xs text-(--color-text-muted)">
      <span>Preview · sample data · nothing saved</span>
      <span className="flex gap-3">
        <Link href="?view=now" className={view === "now" ? "font-medium text-(--color-community-ink)" : "underline"}>Now</Link>
        <Link href="?view=proposed" className={view === "proposed" ? "font-medium text-(--color-community-ink)" : "underline"}>Proposed</Link>
      </span>
    </div>
    <div className="mx-auto w-full max-w-[640px] px-4 pt-[18px] pb-7">
      <NewGroupMockup view={view} />
    </div>
  </div>;
}
