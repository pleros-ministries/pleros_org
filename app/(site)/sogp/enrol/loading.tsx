export default function SogpEnrolLoading() {
  return (
    <main
      aria-label="Loading enrolment form"
      className="site-font-theme min-h-screen bg-[var(--color-surface)]"
    >
      <section className="site-shell-page sogp-shell-page grid animate-pulse gap-10 py-12 md:grid-cols-[minmax(0,0.85fr)_minmax(26rem,1fr)] md:gap-16 md:py-20">
        <div className="grid content-start gap-7">
          <div className="h-4 w-16 rounded bg-[var(--color-brand-sky)]" />
          <div className="grid gap-3">
            <div className="h-14 w-full max-w-[26rem] rounded bg-[var(--color-brand-sky)]" />
            <div className="h-14 w-3/4 max-w-[20rem] rounded bg-[var(--color-brand-sky)]" />
            <div className="mt-2 h-4 w-full max-w-[28rem] rounded bg-[var(--color-surface-muted)]" />
          </div>
          <div className="grid gap-3">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <span className="size-9 rounded-full bg-[var(--color-brand-sky)]" />
                <span className="h-4 w-40 rounded bg-[var(--color-surface-muted)]" />
              </div>
            ))}
          </div>
        </div>
        <div className="grid content-start gap-5 rounded-[var(--radius-md)] border border-[var(--color-line)] bg-white p-5 shadow-[var(--shadow-md)] sm:p-7 md:p-8">
          {[0, 1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="grid gap-2">
              <span className="h-3 w-28 rounded bg-[var(--color-surface-muted)]" />
              <span className="h-11 w-full rounded-[var(--radius-sm)] bg-[var(--color-surface-muted)]" />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
