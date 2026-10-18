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

function getStateClasses(tinted: boolean): Record<SogpCalendarState, string> {
  return {
    complete:
      "border-[var(--color-community-blue,#2056d6)] bg-[var(--color-community-blue,#2056d6)] text-white",
    missed: "border-[#f7e4cd] bg-[#f7e4cd] text-[#92400e]",
    current:
      "border-[var(--color-community-blue,#2056d6)] bg-white text-[var(--color-community-blue,#2056d6)]",
    // Upcoming days carry no state, so they stay quiet. On a tinted (blue)
    // surface they pick up a faint blue instead of grey.
    future: tinted
      ? "border-[#e4ebfd] bg-[#f4f7fe] text-[#8a96b8]"
      : "border-[#f1f2f5] bg-[#f1f2f5] text-[#a6abb2]",
  };
}

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
  tinted = false,
}: {
  days: SogpCalendarDay[];
  selectedDateKey: string;
  todayKey: string;
  onSelect: (dateKey: string) => void;
  tinted?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const stateClasses = getStateClasses(tinted);
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
          "relative grid cursor-pointer place-items-center rounded-[8px] border text-xs font-medium tabular-nums transition-transform duration-150 hover:-translate-y-px active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-community-blue,#2056d6)]",
          compact ? "h-8" : "h-9",
          stateClasses[day.state],
          selected && "ring-2 ring-[var(--color-community-blue,#2056d6)] ring-offset-1",
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
          <CalendarDaysIcon className="size-4 text-[var(--color-community-blue,#2056d6)]" strokeWidth={2} />
          <h2 className="m-0 font-[family-name:var(--font-dashboard-heading)] text-[15px] font-medium leading-[22px] text-(--color-text-strong)">
            {expanded ? "Full calendar" : "This week"}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          aria-expanded={expanded}
          className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[10px] border border-[var(--dashboard-panel-edge,#e2e5ea)] bg-white px-3 text-[12.5px] font-medium text-[var(--color-community-blue,#2056d6)] transition-colors duration-150 hover:bg-[#f8f9fb] active:scale-[0.98]"
        >
          {expanded ? "Collapse" : "Expand"}
          <ChevronDownIcon className={cn("size-3.5 transition-transform duration-150", expanded && "rotate-180")} strokeWidth={2} />
        </button>
      </div>

      {expanded ? [...months].map(([key, monthDays]) => {
        const first = new Date(`${monthDays[0]!.dateKey}T00:00:00.000Z`);
        return (
          <section key={key} aria-label={monthLabel(key)} className="grid gap-2.5">
            <h2 className="m-0 text-[13px] font-medium text-(--color-text-strong)">
              {monthLabel(key)}
            </h2>
            <div className="grid grid-cols-7 gap-1 text-center">
              {weekdays.map((weekday) => (
                <span
                  key={weekday}
                  className="py-0.5 text-[11px] text-(--color-text-muted)"
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
              <span key={weekday} className="py-0.5 text-[11px] text-(--color-text-muted)">
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
