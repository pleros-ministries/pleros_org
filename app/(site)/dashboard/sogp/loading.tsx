function SkeletonBlock({ className }: { className: string }) {
  return (
    <div
      className={`${className} animate-pulse rounded-[var(--radius-sm)] bg-[rgba(6,16,86,0.08)]`}
    />
  );
}

export default function SogpLoading() {
  return (
    <section
      aria-busy="true"
      aria-label="Loading learning page"
      className="site-font-theme bg-[var(--color-surface)] pb-16 pt-5 sm:pb-20 sm:pt-6"
    >
      <div className="container-pleros grid max-w-[36rem] gap-8">
        <SkeletonBlock className="h-4 w-32" />
        <div className="grid gap-3">
          <SkeletonBlock className="h-12 w-56 max-w-full sm:h-14" />
          <SkeletonBlock className="h-4 w-72 max-w-full" />
        </div>
        <div className="grid gap-4">
          <SkeletonBlock className="min-h-[12rem]" />
          <SkeletonBlock className="h-11 w-full" />
        </div>
      </div>
    </section>
  );
}
