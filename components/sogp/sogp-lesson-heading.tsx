export function SogpLessonHeading({
  eyebrow,
  title,
  detail,
}: {
  eyebrow: string;
  title: string;
  detail?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-baseline gap-2.5">
        <h2 className="ppc-heading text-base font-semibold tracking-[-0.01em] text-zinc-900">
          {title}
        </h2>
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-zinc-400">
          {eyebrow}
        </p>
      </div>
      {detail ? (
        <span className="shrink-0 rounded-sm bg-zinc-100 px-2 py-1 text-[0.68rem] font-medium text-zinc-500">
          {detail}
        </span>
      ) : null}
    </div>
  );
}
