import {
  CalendarCheckIcon,
  ExternalLinkIcon,
} from "lucide-react";

import type { SogpJourneyData } from "@/lib/db/queries/sogp-journey";

function progressPercent(completed: number, total: number) {
  return total ? Math.round((completed / total) * 100) : 0;
}

export function SogpContextSidebar({ data }: { data: SogpJourneyData }) {
  const nextReview = data.days.find(
    (day) => day.review && !day.review.complete && day.dateKey >= data.todayKey,
  )?.review;
  const metrics = [
    {
      label: "Teachings",
      value: `${data.progress.coreCompleted}/${data.progress.coreTotal}`,
      percent: progressPercent(data.progress.coreCompleted, data.progress.coreTotal),
    },
    {
      label: "Prayer Watch",
      value: `${data.progress.prayerPercent}%`,
      percent: data.progress.prayerPercent,
    },
    {
      label: "Reviews",
      value: `${data.progress.reviewsCompleted}/${data.progress.reviewsTotal}`,
      percent: progressPercent(data.progress.reviewsCompleted, data.progress.reviewsTotal),
    },
  ];

  return (
    <div className="grid gap-4">
      <section className="rounded-sm border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 px-4 py-3">
          <h2 className="ppc-heading text-sm font-semibold text-zinc-900">Course progress</h2>
        </div>
        <div className="grid gap-3.5 p-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="grid gap-1.5">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="text-zinc-500">{metric.label}</span>
                <strong className="ppc-heading font-semibold text-zinc-900">{metric.value}</strong>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100">
                <div className="h-full rounded-full bg-[var(--color-brand-blue)]" style={{ width: `${Math.min(100, metric.percent)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-sm border border-zinc-200 bg-white">
        <div className="flex items-center gap-2 border-b border-zinc-100 px-4 py-3">
          <CalendarCheckIcon className="size-4 text-[var(--color-brand-blue)]" strokeWidth={2} />
          <h2 className="ppc-heading text-sm font-semibold text-zinc-900">Next required review</h2>
        </div>
        <div className="grid gap-3 p-4">
          {nextReview ? (
            <>
              <p className="text-xs leading-[1.45] text-zinc-500">{nextReview.title}</p>
              <a href={nextReview.liveUrl ?? "#"} target="_blank" rel="noreferrer" className="inline-flex h-8 w-fit items-center gap-1.5 rounded-[6px] border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 active:scale-[0.98]">
                View review <ExternalLinkIcon className="size-3.5" strokeWidth={2} />
              </a>
            </>
          ) : (
            <p className="text-xs text-zinc-500">All currently scheduled reviews are complete.</p>
          )}
        </div>
      </section>
    </div>
  );
}
