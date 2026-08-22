import { HomepageNav } from "@/components/home/homepage-nav";

function Shimmer({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-[#e8e8ee] ${className}`} />;
}

export default function LibraryLoading() {
  return (
    <>
      <HomepageNav />
      <main className="flex min-h-screen w-full bg-[#f9f9fb]">
        {/* Sidebar skeleton */}
        <aside className="sticky top-[4.25rem] hidden h-[calc(100vh-4.25rem)] w-[248px] shrink-0 flex-col gap-5 border-r border-[#e8e8ee] bg-white px-5 py-5 md:flex">
          <div>
            <Shimmer className="mb-3 h-2.5 w-16" />
            <div className="grid grid-cols-2 gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Shimmer key={i} className="h-[60px] rounded-xl" />
              ))}
            </div>
          </div>
          <Shimmer className="h-px" />
          <div>
            <Shimmer className="mb-2 h-2.5 w-12" />
            {Array.from({ length: 3 }).map((_, i) => (
              <Shimmer key={i} className="mb-1.5 h-9 rounded-lg" />
            ))}
          </div>
          <Shimmer className="h-px" />
          <div className="flex-1">
            <Shimmer className="mb-2 h-2.5 w-24" />
            {Array.from({ length: 6 }).map((_, i) => (
              <Shimmer key={i} className="mb-1.5 h-12 rounded-lg" />
            ))}
          </div>
        </aside>

        {/* Content skeleton */}
        <div className="min-w-0 flex-1">
          {/* Header */}
          <div className="border-b border-[#e8e8ee] bg-white px-9 pb-5 pt-9">
            <Shimmer className="mb-2 h-3 w-24" />
            <Shimmer className="mb-2 h-8 w-56" />
            <Shimmer className="mb-5 h-4 w-96" />
            <Shimmer className="mb-3 h-10 rounded-xl" />
            <div className="flex gap-1.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Shimmer key={i} className="h-9 w-20 rounded-full" />
              ))}
            </div>
          </div>
          {/* Table rows */}
          <div className="px-9 pt-3.5">
            <Shimmer className="mb-4 h-3 w-28" />
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 border-b border-[#e8e8ee] py-3.5">
                <Shimmer className="h-3 w-6" />
                <Shimmer className="h-4 flex-1" />
                <Shimmer className="hidden h-3 w-24 md:block" />
                <Shimmer className="hidden h-3 w-10 md:block" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
