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
    <div className="grid gap-3">
      <section className="rounded-[var(--radius-md)] border border-[var(--color-line)] bg-white p-4">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-[var(--color-brand-blue)]">Course progress</p>
        <div className="mt-4 grid gap-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="grid gap-1.5">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="text-[var(--color-text-muted)]">{metric.label}</span>
                <strong className="font-[var(--font-sen)] text-[var(--color-text-strong)]">{metric.value}</strong>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
                <div className="h-full rounded-full bg-[var(--color-brand-blue)]" style={{ width: `${Math.min(100, metric.percent)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[var(--radius-md)] border border-[var(--color-line)] bg-white p-4">
        <CalendarCheckIcon className="size-5 text-[var(--color-brand-blue)]" strokeWidth={2} />
        <h2 className="mt-3 font-[var(--font-sen)] text-sm font-semibold text-[var(--color-text-strong)]">Next required review</h2>
        {nextReview ? (
          <>
            <p className="mt-1 text-xs leading-[1.45] text-[var(--color-text-muted)]">{nextReview.title}</p>
            <a href={nextReview.liveUrl ?? "#"} target="_blank" rel="noreferrer" className="mt-3 inline-flex min-h-9 items-center gap-1.5 rounded-full border border-[var(--color-brand-blue)] px-3 text-[0.7rem] font-semibold text-[var(--color-brand-blue)] active:scale-[0.96]">
              View review <ExternalLinkIcon className="size-3.5" strokeWidth={2} />
            </a>
          </>
        ) : (
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">All currently scheduled reviews are complete.</p>
        )}
      </section>

    </div>
  );
}
