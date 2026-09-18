export function SogpDashboardSkeleton() {
  return (
    <div
      className="site-font-theme min-h-screen animate-pulse bg-[var(--color-surface-muted)] pb-16"
      aria-label="Loading SOGP dashboard"
      aria-busy="true"
    >
      <div className="h-32 bg-[var(--color-brand-blue)]" />
      <div className="site-shell-page sogp-shell-page grid gap-4 pt-4">
        <div className="h-20 rounded-[var(--radius-md)] bg-white" />
        <div className="h-96 rounded-[var(--radius-md)] bg-white" />
        <div className="h-72 rounded-[var(--radius-md)] bg-[var(--color-brand-sky-soft)]" />
      </div>
    </div>
  );
}
