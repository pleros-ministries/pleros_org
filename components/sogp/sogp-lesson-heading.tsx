export function SogpLessonHeading({
  metadata,
  title,
}: {
  metadata: string;
  title: string;
}) {
  return (
    <div className="grid gap-1.5 border-b border-[var(--color-line)] pb-4">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
        {metadata}
      </p>
      <h2 className="max-w-[42rem] font-[var(--font-sen)] text-[1.65rem] font-semibold leading-[1.08] tracking-[-0.045em] text-[var(--color-text-strong)] md:text-[1.9rem]">
        {title}
      </h2>
    </div>
  );
}
