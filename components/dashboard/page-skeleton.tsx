function Bar({ className }: { className: string }) {
  return <div className={`${className} animate-pulse rounded-md bg-[rgba(6,16,86,0.07)]`} />;
}

/**
 * Neutral loading shapes for the You tabs: a title, a subtitle, then cards
 * (Library, Partner) or a list (Profile, Podcast, Teachings). They match the
 * pages' 640px column so the swap to real content does not jump.
 */
export function PageSkeleton({ variant = "list", label }: { variant?: "cards" | "list"; label: string }) {
  return <section aria-busy="true" aria-label={label} className="mx-auto grid w-full max-w-[640px] gap-3 px-4 pt-[18px] pb-7">
    <Bar className="h-7 w-36" />
    <Bar className="h-4 w-60 max-w-full" />
    {variant === "cards"
      ? <div className="mt-1 grid gap-3">{[0, 1, 2].map(i => <Bar key={i} className="h-[140px] rounded-[18px]" />)}</div>
      : <div className="mt-2 grid overflow-hidden rounded-[10px] border border-[var(--dashboard-panel-edge,#e2e5ea)] bg-white">
        {[0, 1, 2, 3, 4].map(i => <div key={i} className="flex items-center gap-3 border-t border-(--color-line) px-3.5 py-3 first:border-t-0">
          <Bar className="size-9 shrink-0 rounded-[10px]" />
          <div className="grid flex-1 gap-1.5"><Bar className="h-3.5 w-2/3" /><Bar className="h-3 w-1/3" /></div>
        </div>)}
      </div>}
  </section>;
}
