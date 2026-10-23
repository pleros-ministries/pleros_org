import { dashboardFont, dashboardHeadingFont } from "@/components/dashboard/v3/font";
import styles from "@/components/dashboard/v3/dashboard.module.css";
import { HomeShareDaysMockup } from "@/components/dashboard/v3/home-share-days-mockup";

export const metadata = { title: "You Home share and days mockup", robots: { index: false, follow: false } };

/** Mockup of You Home's share card and tappable SOGP days. Sample data; nothing saves. */
export default function HomeShareDaysPreview() {
  return <div className={`${dashboardFont.className} ${dashboardFont.variable} ${dashboardHeadingFont.variable} ${styles.root} min-h-dvh bg-[var(--color-community-canvas,#f8f6f2)]`} data-dashboard-v3>
    <p className="px-4 py-2 text-xs text-(--color-text-muted)">Mockup · You Home · sample data · nothing saved</p>
    <div className="mx-auto max-w-[560px]"><HomeShareDaysMockup /></div>
  </div>;
}
