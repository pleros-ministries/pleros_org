"use client";

import { useState } from "react";
import { CalendarDaysIcon, ChevronDownIcon } from "lucide-react";

import type { SogpCalendarState } from "@/lib/sogp/calendar";
import { getSogpLearningWeek } from "@/lib/sogp/calendar";
import { cn } from "@/lib/utils";

export type SogpCalendarDay = {
  dateKey: string;
  state: SogpCalendarState;
  dayNumber?: number;
};

const stateLabels: Record<SogpCalendarState, string> = {
  complete: "Complete",
  missed: "Missed",
  current: "Today — incomplete",
  future: "Upcoming",
};

const stateClasses: Record<SogpCalendarState, string> = {
  complete:
    "border-[var(--color-brand-lime)] bg-[var(--color-brand-lime)] text-[var(--color-brand-blue)]",
  missed: "border-red-200 bg-red-50 text-red-800",
  current:
    "border-zinc-300 bg-white text-zinc-900",
  future:
    "border-zinc-200 bg-zinc-50 text-zinc-400",
};

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const learningWeekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const monthFormatter = new Intl.DateTimeFormat("en-NG", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

function monthKey(dateKey: string) {
  return dateKey.slice(0, 7);
}

function monthLabel(key: string) {
  return monthFormatter.format(new Date(`${key}-01T00:00:00.000Z`));
}

export function SogpCalendar({
  days,
  selectedDateKey,
  todayKey,
  onSelect,
}: {
  days: SogpCalendarDay[];
  selectedDateKey: string;
  todayKey: string;
  onSelect: (dateKey: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const months = days.reduce<Map<string, SogpCalendarDay[]>>((result, day) => {
    const key = monthKey(day.dateKey);
    result.set(key, [...(result.get(key) ?? []), day]);
    return result;
  }, new Map());
  const learningWeek = getSogpLearningWeek(days, selectedDateKey);

  function dayButton(day: SogpCalendarDay, compact = false) {
    const selected = day.dateKey === selectedDateKey;
    const today = day.dateKey === todayKey;
    return (
      <button
        key={day.dateKey}
        type="button"
        onClick={() => onSelect(day.dateKey)}
        aria-label={`${day.dateKey}. ${stateLabels[day.state]}`}
        aria-pressed={selected}
        className={cn(
          "relative grid cursor-pointer place-items-center rounded-[0.4rem] border text-xs font-semibold transition-transform duration-150 hover:-translate-y-px active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]",
          compact ? "h-8" : "h-9",
          stateClasses[day.state],
          selected && "ring-1 ring-[var(--color-brand-blue)]",
          today && "after:absolute after:inset-x-2 after:bottom-1 after:h-0.5 after:rounded-full after:bg-current",
        )}
      >
        {Number(day.dateKey.slice(-2))}
      </button>
    );
  }

  return (
    <div className="grid gap-2.5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarDaysIcon className="size-4 text-[var(--color-brand-blue)]" strokeWidth={2} />
          <h2 className="ppc-heading text-sm font-semibold text-zinc-900">
            {expanded ? "Full calendar" : "This week"}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          aria-expanded={expanded}
          className="inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-[6px] border border-zinc-200 bg-white px-2.5 text-[0.68rem] font-medium text-zinc-600 transition-colors duration-150 hover:bg-zinc-50 active:scale-[0.98]"
        >
          {expanded ? "Collapse" : "Expand"}
          <ChevronDownIcon className={cn("size-3.5 transition-transform duration-150", expanded && "rotate-180")} strokeWidth={2} />
        </button>
      </div>

      {expanded ? [...months].map(([key, monthDays]) => {
        const first = new Date(`${monthDays[0]!.dateKey}T00:00:00.000Z`);
        return (
          <section key={key} aria-label={monthLabel(key)} className="grid gap-2.5">
            <h2 className="ppc-heading text-sm font-semibold text-zinc-900">
              {monthLabel(key)}
            </h2>
            <div className="grid grid-cols-7 gap-1 text-center">
              {weekdays.map((weekday) => (
                <span
                  key={weekday}
                  className="py-0.5 text-[0.58rem] font-semibold uppercase tracking-[0.06em] text-zinc-400"
                >
                  {weekday}
                </span>
              ))}
              {Array.from({ length: first.getUTCDay() }, (_, index) => (
                <span key={`blank-${index}`} aria-hidden="true" />
              ))}
              {monthDays.map((day) => {
                return dayButton(day);
              })}
            </div>
          </section>
        );
      }) : (
        <section aria-label="Selected learning week" className="grid gap-1.5">
          <div className="grid grid-cols-7 gap-1 text-center">
            {learningWeekdays.map((weekday) => (
              <span key={weekday} className="py-0.5 text-[0.55rem] font-semibold uppercase tracking-[0.05em] text-zinc-400">
                {weekday}
              </span>
            ))}
            {learningWeek.map((day, index) =>
              day ? dayButton(day, true) : <span key={`empty-${index}`} aria-hidden="true" />,
            )}
          </div>
        </section>
      )}
    </div>
  );
}
