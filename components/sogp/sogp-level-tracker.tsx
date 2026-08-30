"use client";

import { useState } from "react";
import { ChevronDownIcon } from "lucide-react";

import type { SogpJourneyData } from "@/lib/db/queries/sogp-journey";

export function SogpLevelTracker({
  levels,
}: {
  levels: SogpJourneyData["levels"];
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-line)] bg-white">
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((current) => !current)}
        className="flex min-h-12 w-full items-center justify-between gap-3 px-4 text-left lg:hidden"
      >
        <span className="font-[var(--font-sen)] text-sm font-semibold text-[var(--color-text-strong)]">Level progress</span>
        <ChevronDownIcon className={`size-4 text-[var(--color-text-muted)] transition-transform duration-150 ${expanded ? "rotate-180" : ""}`} strokeWidth={2} />
      </button>
      <div className="hidden px-4 pb-2 pt-4 lg:block">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-[var(--color-brand-blue)]">Level progress</p>
      </div>
      <div className={`${expanded ? "grid" : "hidden"} divide-y divide-[var(--color-line)] border-t border-[var(--color-line)] lg:grid`}>
        {levels.map((level) => {
          const percent = Math.round((level.completed / level.total) * 100);
          const markerClass = level.status === "complete"
            ? "bg-[var(--color-brand-lime)]"
            : level.status === "locked"
              ? "bg-[var(--color-line-strong)]"
              : "bg-[var(--color-brand-blue)]";
          return (
            <div key={level.level} className="grid gap-2 px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-2">
                  <span className={`size-2 rounded-full ${markerClass}`} />
                  <strong className="font-[var(--font-sen)] text-xs text-[var(--color-text-strong)]">Level {level.level}</strong>
                </span>
                <span className="text-[0.6rem] font-semibold uppercase tracking-[0.06em] text-[var(--color-text-muted)]">{level.status.replaceAll("_", " ")}</span>
              </div>
              <div className="flex items-center justify-between gap-3 text-[0.65rem] text-[var(--color-text-muted)]">
                <span className="truncate">{level.title}</span>
                <span className="shrink-0 font-semibold text-[var(--color-text-strong)]">{level.completed}/{level.total}</span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
                <div className="h-full rounded-full bg-[var(--color-brand-blue)]" style={{ width: `${percent}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
