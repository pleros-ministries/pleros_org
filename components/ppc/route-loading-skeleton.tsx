export function PpcRouteLoadingSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading page" className="grid gap-6">
      <div className="grid gap-1">
        <div className="h-5 w-36 animate-pulse rounded-sm bg-zinc-200" />
        <div className="h-3 w-56 max-w-full animate-pulse rounded-sm bg-zinc-100" />
      </div>

      <div className="grid gap-3">
        <div className="h-10 animate-pulse rounded-sm border border-zinc-200 bg-white" />
        <div className="h-32 animate-pulse rounded-sm border border-zinc-200 bg-white" />
        <div className="h-32 animate-pulse rounded-sm border border-zinc-200 bg-white" />
      </div>
    </div>
  );
}
