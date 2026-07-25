function SkeletonBlock({ className }: { className: string }) {
  return (
    <div
      className={`${className} animate-pulse rounded-[var(--radius-sm)] bg-[rgba(6,16,86,0.08)]`}
    />
  );
}

export default function DashboardLoading() {
  return (
    <section
      aria-busy="true"
      aria-label="Loading dashboard page"
      className="site-font-theme bg-[var(--color-surface)] pb-16 pt-5 sm:pb-20 sm:pt-6"
    >
      <div className="container-pleros grid max-w-[36rem] gap-8">
        <SkeletonBlock className="h-4 w-32" />

        <div className="grid gap-3">
          <SkeletonBlock className="h-12 w-56 max-w-full sm:h-14" />
          <SkeletonBlock className="h-4 w-72 max-w-full" />
          <SkeletonBlock className="h-4 w-48 max-w-full" />
        </div>

        <div className="grid gap-4">
          <SkeletonBlock className="h-5 w-36" />
          <div className="grid grid-cols-2 gap-4">
            <SkeletonBlock className="min-h-[14.625rem] sm:min-h-[15.5rem]" />
            <SkeletonBlock className="min-h-[14.625rem] sm:min-h-[15.5rem]" />
          </div>
        </div>

        <div className="grid gap-3 rounded-[1.25rem] border border-[var(--color-line)] bg-white p-4 shadow-[var(--shadow-sm)] sm:p-5">
          <div className="flex items-center justify-between gap-4">
            <SkeletonBlock className="h-5 w-28" />
            <SkeletonBlock className="h-6 w-24" />
          </div>
          <SkeletonBlock className="h-10 w-full" />
          <SkeletonBlock className="h-24 w-full" />
          <SkeletonBlock className="h-24 w-full" />
        </div>
      </div>
    </section>
  );
}
