import { dashboardFont, dashboardHeadingFont } from "@/components/dashboard/v3/font";
import styles from "@/components/dashboard/v3/dashboard.module.css";

import { TourScreens, type Screen } from "./screens";
import { TourOverlay } from "./tour";

export const metadata = { title: "Guided tour preview", robots: { index: false, follow: false } };

// Reads searchParams on every request (Cache Components).
export const instant = false;

const SCREENS: Screen[] = ["home", "choose", "plan-podcast", "plan-doctrinal", "learning-sogp", "learning-podcast", "learning-doctrinal", "home-sogp", "home-podcast", "home-doctrinal"];

/**
 * Mockup: the guided tour a new learner gets after signing up (user, 24
 * November), over the real screens on sample data. `arrival=link` is someone
 * who joined through a leader's group link; `path` presets the branch for
 * recordings (otherwise the tour follows what you tap). Nothing saves.
 */
export default async function GuidedTourPreview({ searchParams }: { searchParams: Promise<{ screen?: string; arrival?: string }> }) {
  const query = await searchParams;
  const screen = SCREENS.includes(query.screen as Screen) ? query.screen as Screen : "home";
  const arrival = query.arrival === "link" ? "link" : "direct";
  return <div className={`${dashboardFont.className} ${dashboardFont.variable} ${dashboardHeadingFont.variable} ${styles.root} min-h-dvh bg-[var(--color-community-canvas,#f8f6f2)] [&_h1]:text-[21px] [&_h1]:leading-[28px] [&_h1]:font-medium`} data-dashboard-v3>
    <p className="px-4 pt-2 text-xs text-(--color-text-muted)" data-preview-label>Preview · guided tour · sample data · nothing saved</p>
    <TourScreens screen={screen} arrival={arrival} />
    <TourOverlay />
  </div>;
}
