"use client";

import { WelcomeDashboardView } from "@/components/dashboard/welcome-dashboard-view";
import { resolveWelcomeDashboardSections } from "@/lib/welcome-dashboard-content";
import { dashboardNavigation } from "@/lib/preview/pleros/navigation";
import { useDemo } from "./demo-context";

/** Actual home presentation, with synthetic props and preview-only destinations. */
export function ConsolidatedHomeView() {
  const { viewer, today, greeting, href } = useDemo();
  const sections = resolveWelcomeDashboardSections({ isSogpEnrolled: viewer.inCohort, communityAccess: true, startsAt: null, now: new Date(`${today}T12:00:00Z`) });
  const entries = dashboardNavigation.flatMap((section) => section.items);
  function resolveHref(actual: string) {
    const entry = entries.find((item) => item.actualRoute === actual);
    return href(entry?.path ?? (actual === "/sogp/enrol" ? "destinations/pre-sogp" : "destinations/welcome-pack"));
  }
  return <WelcomeDashboardView name={viewer.firstName} greeting={greeting} sections={sections} resolveHref={resolveHref} showInstallCta={false} className="px-0 pt-0 sm:px-0 sm:pt-0 lg:px-0 lg:pt-0" />;
}
