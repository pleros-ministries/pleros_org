/** Quiet skeleton shown while the demo shell or a view loads. */
export function DemoLoading({ inShell = false }: { inShell?: boolean }) {
  const content = (
    <div aria-busy="true" aria-label="Loading the demo" className="grid animate-pulse gap-5">
      <div className="grid gap-2">
        <div className="h-3.5 w-36 rounded-full bg-(--color-line)" />
        <div className="h-8 w-64 rounded-full bg-(--color-line)" />
      </div>
      <div className="h-24 rounded-[var(--radius-lg)] border border-(--color-line) bg-white" />
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="h-28 rounded-[var(--radius-lg)] border border-(--color-line) bg-white" />
        <div className="h-28 rounded-[var(--radius-lg)] border border-(--color-line) bg-white" />
        <div className="h-28 rounded-[var(--radius-lg)] border border-(--color-line) bg-white" />
      </div>
    </div>
  );
  if (inShell) return content;
  return (
    <div className="min-h-dvh bg-(--color-surface-muted)">
      <div className="h-12 bg-(--color-brand-blue)" />
      <div className="mx-auto max-w-[1120px] px-4 pt-8 sm:px-6 lg:pl-[calc(16rem+2.5rem)]">{content}</div>
    </div>
  );
}
