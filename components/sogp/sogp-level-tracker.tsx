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
    <section className="overflow-hidden rounded-[10px] border border-[var(--dashboard-panel-edge,#e2e5ea)] bg-white">
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((current) => !current)}
        className="flex min-h-10 w-full cursor-pointer items-center justify-between gap-3 border-b border-[var(--color-line,#e7e9ec)] px-3.5 text-left lg:hidden"
      >
        <span className="font-[family-name:var(--font-dashboard-heading)] text-[15px] font-medium text-(--color-text-strong)">Level progress</span>
        <ChevronDownIcon className={`size-4 text-[#a6abb2] transition-transform duration-150 ${expanded ? "rotate-180" : ""}`} strokeWidth={2} />
      </button>
      <div className="hidden border-b border-[var(--color-line,#e7e9ec)] px-3.5 py-3 lg:block">
        <h2 className="m-0 font-[family-name:var(--font-dashboard-heading)] text-[15px] font-medium leading-[22px] text-(--color-text-strong)">Level progress</h2>
      </div>
      <div className={`${expanded ? "grid" : "hidden"} divide-y divide-[var(--color-line,#e7e9ec)] lg:grid`}>
        {levels.map((level) => {
          const percent = Math.round((level.completed / level.total) * 100);
          const markerClass = level.status === "complete"
            ? "bg-[var(--color-community-blue,#2056d6)]"
            : level.status === "locked"
              ? "bg-[#c3c8cf]"
              : "bg-[#d98a1f]";
          return (
            <div key={level.level} className="grid gap-2 px-3.5 py-3">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-2">
                  <span className={`size-2 rounded-full ${markerClass}`} />
                  <strong className="text-[13px] font-medium text-(--color-text-strong)">Level {level.level}</strong>
                </span>
                <span className="inline-block text-xs text-(--color-text-muted) first-letter:uppercase">{level.status.replaceAll("_", " ")}</span>
              </div>
              <div className="flex min-w-0 items-center justify-between gap-3 text-xs text-(--color-text-muted)">
                <span className="truncate">{level.title}</span>
                <span className="shrink-0 font-medium tabular-nums text-(--color-text-strong)">{level.completed}/{level.total}</span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-[#e9edf5]">
                <div className="h-full rounded-full bg-[var(--color-community-blue,#2056d6)]" style={{ width: `${percent}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
