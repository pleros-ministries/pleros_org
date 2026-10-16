function SkeletonBlock({ className }: { className: string }) {
  return (
    <div
      className={`${className} animate-pulse rounded-[var(--radius-sm)] bg-[rgba(6,16,86,0.08)]`}
    />
  );
}

export default function MessagesLoading() {
  return (
    <section
      aria-busy="true"
      aria-label="Loading messages"
      className="site-font-theme bg-[var(--color-surface)] pb-16 pt-5 sm:pb-20 sm:pt-6"
    >
      <div className="container-pleros grid max-w-[36rem] gap-4">
        <SkeletonBlock className="h-4 w-32" />
        <SkeletonBlock className="min-h-[16rem]" />
        <SkeletonBlock className="h-11 w-full" />
      </div>
    </section>
  );
}
