"use client";

import {
  CheckCircle2Icon,
  CircleIcon,
  LockKeyholeIcon,
} from "lucide-react";

import type { SogpJourneyData } from "@/lib/db/queries/sogp-journey";

export function SogpCourseOutline({
  data,
  selectedDateKey,
  onSelect,
  className = "",
  listClassName = "",
}: {
  data: SogpJourneyData;
  selectedDateKey: string;
  onSelect: (dateKey: string) => void;
  className?: string;
  listClassName?: string;
}) {
  return (
    <nav aria-label="Course curriculum" className={`overflow-hidden rounded-sm border border-zinc-200 bg-white ${className}`}>
      <div className="border-b border-zinc-100 px-4 py-3">
        <h2 className="ppc-heading text-sm font-semibold text-zinc-900">Course outline</h2>
      </div>
      <div className={`overflow-y-auto px-2 pb-3 ${listClassName}`}>
        {data.levels.map((level) => {
          const levelDays = data.days.filter(
            (day) => day.track?.curriculumLevel === level.level,
          );
          return (
            <section key={level.level} className="border-t border-zinc-100 py-2.5 first:border-t-0">
              <div className="flex items-center justify-between gap-2 px-2 pb-1.5">
                <strong className="ppc-heading text-xs font-semibold text-zinc-900">Level {level.level}</strong>
                <span className="text-[0.6rem] font-semibold uppercase tracking-[0.06em] text-zinc-400">{level.completed}/{level.total}</span>
              </div>
              <div className="grid gap-0.5">
                {levelDays.map((day) => {
                  const track = day.track!;
                  const selected = day.dateKey === selectedDateKey;
                  const Icon = track.assessmentComplete
                    ? CheckCircle2Icon
                    : track.accessible
                      ? CircleIcon
                      : LockKeyholeIcon;
                  return (
                    <button
                      key={track.id}
                      type="button"
                      onClick={() => onSelect(day.dateKey)}
                      aria-current={selected ? "page" : undefined}
                      className={`grid min-h-9 w-full cursor-pointer grid-cols-[1rem_1fr] items-start gap-2 rounded-sm px-2 py-2 text-left transition-colors duration-150 active:scale-[0.98] ${selected ? "bg-[var(--color-brand-sky)] text-zinc-900" : "text-zinc-700 hover:bg-zinc-50"}`}
                    >
                      <Icon className={`mt-0.5 size-3.5 ${track.accessible || track.assessmentComplete ? "text-[var(--color-brand-blue)]" : "text-zinc-300"}`} strokeWidth={2} />
                      <span className="text-[0.7rem] leading-[1.35]">{track.levelPosition}. {track.title}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </nav>
  );
}
