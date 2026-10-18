import DashboardLoading from "@/app/(site)/dashboard/loading";

/**
 * The dashboard's static shell under Cache Components: the brand-blue top bar
 * and a page skeleton, prerendered with no viewer data so it paints at once
 * while the session, navigation and page stream in behind it.
 */
export function DashboardFrameFallback() {
  return (
    <div className="min-h-dvh bg-[var(--color-surface)]">
      <div aria-hidden className="h-11 w-full bg-[#051480]" />
      <DashboardLoading />
    </div>
  );
}
