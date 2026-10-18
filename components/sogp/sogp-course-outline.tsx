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
    <nav aria-label="Course curriculum" className={`overflow-hidden rounded-[10px] border border-[var(--dashboard-panel-edge,#e2e5ea)] bg-white ${className}`}>
      <div className="border-b border-[var(--color-line,#e7e9ec)] px-3.5 py-3">
        <h2 className="m-0 font-[family-name:var(--font-dashboard-heading)] text-[15px] font-medium leading-[22px] text-(--color-text-strong)">Course outline</h2>
      </div>
      <div className={`overflow-y-auto px-2 pb-3 ${listClassName}`}>
        {data.levels.map((level) => {
          const levelDays = data.days.filter(
            (day) => day.track?.curriculumLevel === level.level,
          );
          return (
            <section key={level.level} className="border-t border-[var(--color-line,#e7e9ec)] py-2.5 first:border-t-0">
              <div className="flex items-center justify-between gap-2 px-2 pb-1.5">
                <strong className="text-[13px] font-medium text-(--color-text-strong)">Level {level.level}</strong>
                <span className="text-xs tabular-nums text-(--color-text-muted)">{level.completed}/{level.total}</span>
              </div>
              <div className="grid gap-0.5">
                {levelDays.map((day) => {
                  const track = day.track!;
                  const selected = day.dateKey === selectedDateKey;
                  // `assessmentComplete` and `accessible` are computed
                  // independently — never let a checkmark render for a
                  // track that's still locked.
                  const trackComplete = track.accessible && track.assessmentComplete;
                  const Icon = trackComplete
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
                      className={`grid min-h-9 w-full cursor-pointer grid-cols-[1rem_1fr] items-start gap-2 rounded-sm px-2 py-2 text-left transition-colors duration-150 active:scale-[0.98] ${selected ? "bg-[#eef3fe] text-[var(--color-community-blue,#2056d6)]" : "text-(--color-text-strong) hover:bg-[#f8f9fb]"}`}
                    >
                      <Icon className={`mt-0.5 size-3.5 ${track.accessible ? "text-[var(--color-community-blue,#2056d6)]" : "text-[#c3c8cf]"}`} strokeWidth={2} />
                      <span className="text-[12.5px] leading-[1.4]">{track.levelPosition}. {track.title}</span>
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
