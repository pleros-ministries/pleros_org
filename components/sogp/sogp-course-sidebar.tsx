"use client";

import {
  CheckCircle2Icon,
  CircleIcon,
  LockKeyholeIcon,
} from "lucide-react";

import type { SogpJourneyData } from "@/lib/db/queries/sogp-journey";

import { SogpCalendar } from "./sogp-calendar";
import { SogpLevelTracker } from "./sogp-level-tracker";

export function SogpCourseSidebar({
  data,
  selectedDateKey,
  onSelect,
}: {
  data: SogpJourneyData;
  selectedDateKey: string;
  onSelect: (dateKey: string) => void;
}) {
  return (
    <div className="grid gap-3">
      <section className="rounded-[var(--radius-md)] border border-[var(--color-line)] bg-white p-3.5">
        <SogpCalendar
          days={data.days}
          selectedDateKey={selectedDateKey}
          todayKey={data.todayKey}
          onSelect={onSelect}
        />
      </section>

      <SogpLevelTracker levels={data.levels} />

      <nav aria-label="Course curriculum" className="hidden overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-line)] bg-white lg:block">
        <div className="px-4 pb-2 pt-4">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-[var(--color-brand-blue)]">Course outline</p>
        </div>
        <div className="max-h-[calc(100vh-19rem)] overflow-y-auto px-2 pb-3">
          {data.levels.map((level) => {
            const levelDays = data.days.filter(
              (day) => day.track?.curriculumLevel === level.level,
            );
            return (
              <section key={level.level} className="border-t border-[var(--color-line)] py-3 first:border-t-0">
                <div className="flex items-center justify-between gap-2 px-2 pb-2">
                  <strong className="font-[var(--font-sen)] text-xs text-[var(--color-text-strong)]">Level {level.level}</strong>
                  <span className="text-[0.6rem] font-semibold uppercase tracking-[0.06em] text-[var(--color-text-muted)]">{level.completed}/{level.total}</span>
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
                        className={`grid min-h-10 w-full grid-cols-[1rem_1fr] items-start gap-2 rounded-[0.45rem] px-2 py-2 text-left transition-colors duration-150 active:scale-[0.96] ${selected ? "bg-[var(--color-brand-sky)]" : "hover:bg-[var(--color-surface-muted)]"}`}
                      >
                        <Icon className="mt-0.5 size-3.5 text-[var(--color-brand-blue)]" strokeWidth={2} />
                        <span className="text-[0.7rem] leading-[1.35] text-[var(--color-text-strong)]">{track.levelPosition}. {track.title}</span>
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
