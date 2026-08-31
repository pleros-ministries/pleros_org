export function SogpLessonHeading({
  eyebrow,
  title,
  detail,
}: {
  eyebrow: string;
  title: string;
  detail: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4 border-b border-[var(--color-line)] pb-4">
      <div className="grid gap-1">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
          {eyebrow}
        </p>
        <h2 className="font-[var(--font-sen)] text-xl font-semibold leading-none tracking-[-0.035em] text-[var(--color-text-strong)]">
          {title}
        </h2>
      </div>
      <span className="shrink-0 rounded-full bg-[var(--color-surface-muted)] px-3 py-1.5 text-[0.68rem] font-medium text-[var(--color-text-muted)]">
        {detail}
      </span>
    </div>
  );
}
