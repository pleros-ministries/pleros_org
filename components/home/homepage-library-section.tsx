export function HomepageLibrarySection() {
  return (
    <section id="library" className="bg-white px-[1.5625rem] pb-[8.0625rem] pt-[2.625rem]">
      <div className="grid gap-[2.3125rem]">
        <div className="grid gap-3">
          <h2 className="site-section-heading">
            Browse the Library
          </h2>
          <p className="max-w-[27.8125rem] text-[var(--text-body)] leading-[1.25] tracking-[-0.02em] text-[var(--color-text)]">
            For light in God&apos;s Word and clarity on subject matters like The
            New Creation, Redemption, God&apos;s Purpose.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div className="aspect-[304/300] rounded-[11px] bg-[var(--color-brand-purple-soft)]" />
          <div className="aspect-[304/300] rounded-[11px] bg-[var(--color-brand-purple-soft)]" />
        </div>
      </div>
    </section>
  );
}
