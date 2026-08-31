export default function SetupLoading() {
  return (
    <main className="site-font-theme min-h-[75vh] bg-[var(--color-surface-muted)] py-10 md:py-16">
      <section className="site-shell-page sogp-shell-page grid place-items-center">
        <div className="grid w-full max-w-[32rem] animate-pulse gap-5 rounded-[var(--radius-md)] border border-[var(--color-line)] bg-white p-6 shadow-[var(--shadow-sm)] sm:p-8">
          <div className="size-11 rounded-full bg-[var(--color-brand-sky)]" />
          <div className="h-9 w-3/4 rounded bg-[var(--color-brand-sky)]" />
          <div className="h-4 w-full rounded bg-[var(--color-surface-muted)]" />
          <div className="h-12 w-full rounded-[var(--radius-sm)] bg-[var(--color-surface-muted)]" />
          <div className="h-12 w-full rounded-full bg-[var(--color-brand-blue)]/20" />
        </div>
      </section>
    </main>
  );
}
