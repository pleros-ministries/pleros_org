"use client";

import { useState } from "react";
import { ChevronDownIcon } from "lucide-react";

import type { SogpJourneyData } from "@/lib/db/queries/sogp-journey";

export function SogpLevelTracker({
  levels,
  defaultExpanded = false,
}: {
  levels: SogpJourneyData["levels"];
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <section className="overflow-hidden rounded-sm border border-zinc-200 bg-white">
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((current) => !current)}
        className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 border-b border-zinc-100 px-4 text-left lg:hidden"
      >
        <span className="ppc-heading text-sm font-semibold text-zinc-900">Level progress</span>
        <ChevronDownIcon className={`size-4 text-zinc-400 transition-transform duration-150 ${expanded ? "rotate-180" : ""}`} strokeWidth={2} />
      </button>
      <div className="hidden border-b border-zinc-100 px-4 py-3 lg:block">
        <h2 className="ppc-heading text-sm font-semibold text-zinc-900">Level progress</h2>
      </div>
      <div className={`${expanded ? "grid" : "hidden"} divide-y divide-zinc-100 lg:grid`}>
        {levels.map((level) => {
          const percent = Math.round((level.completed / level.total) * 100);
          const markerClass = level.status === "complete"
            ? "bg-[var(--color-brand-lime)]"
            : level.status === "locked"
              ? "bg-zinc-300"
              : "bg-[var(--color-brand-blue)]";
          return (
            <div key={level.level} className="grid gap-2 px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-2">
                  <span className={`size-2 rounded-full ${markerClass}`} />
                  <strong className="ppc-heading text-xs font-semibold text-zinc-900">Level {level.level}</strong>
                </span>
                <span className="text-[0.6rem] font-semibold uppercase tracking-[0.06em] text-zinc-400">{level.status.replaceAll("_", " ")}</span>
              </div>
              <div className="flex items-center justify-between gap-3 text-[0.65rem] text-zinc-500">
                <span className="truncate">{level.title}</span>
                <span className="shrink-0 font-semibold text-zinc-900">{level.completed}/{level.total}</span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-zinc-100">
                <div className="h-full rounded-full bg-[var(--color-brand-blue)]" style={{ width: `${percent}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
