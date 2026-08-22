export function SogpDashboardSkeleton() {
  return (
    <div className="site-shell-page grid animate-pulse gap-5 py-10" aria-label="Loading SOGP dashboard" aria-busy="true">
      <div className="h-10 w-64 rounded bg-[var(--color-surface-muted)]" />
      <div className="grid gap-4 lg:grid-cols-[15rem_minmax(0,1fr)_18rem]">
        <div className="h-[30rem] rounded-[var(--radius-md)] bg-[var(--color-surface-muted)]" />
        <div className="grid gap-4">
          <div className="h-64 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)]" />
          <div className="h-48 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)]" />
        </div>
        <div className="h-80 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)]" />
      </div>
    </div>
  );
}
