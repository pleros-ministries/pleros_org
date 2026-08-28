"use client";

import type { SogpCalendarState } from "@/lib/sogp/calendar";
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
    "border-[var(--color-line-strong)] bg-white text-[var(--color-text-strong)]",
  future:
    "border-[var(--color-line)] bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]",
};

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function monthKey(dateKey: string) {
  return dateKey.slice(0, 7);
}

function monthLabel(key: string) {
  return new Intl.DateTimeFormat("en-NG", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${key}-01T00:00:00.000Z`));
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
  const months = days.reduce<Map<string, SogpCalendarDay[]>>((result, day) => {
    const key = monthKey(day.dateKey);
    result.set(key, [...(result.get(key) ?? []), day]);
    return result;
  }, new Map());

  return (
    <div className="grid gap-5">
      {[...months].map(([key, monthDays]) => {
        const first = new Date(`${monthDays[0]!.dateKey}T00:00:00.000Z`);
        return (
          <section key={key} aria-label={monthLabel(key)} className="grid gap-2.5">
            <h2 className="font-[var(--font-sen)] text-sm font-semibold text-[var(--color-text-strong)]">
              {monthLabel(key)}
            </h2>
            <div className="grid grid-cols-7 gap-1 text-center">
              {weekdays.map((weekday) => (
                <span
                  key={weekday}
                  className="py-1 text-[0.58rem] font-semibold uppercase tracking-[0.06em] text-[var(--color-text-muted)]"
                >
                  {weekday}
                </span>
              ))}
              {Array.from({ length: first.getUTCDay() }, (_, index) => (
                <span key={`blank-${index}`} aria-hidden="true" />
              ))}
              {monthDays.map((day) => {
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
                      "relative grid aspect-square min-h-10 place-items-center rounded-[0.45rem] border text-xs font-semibold transition-transform duration-150 hover:-translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-blue)]",
                      stateClasses[day.state],
                      selected && "ring-2 ring-[var(--color-brand-blue)] ring-offset-1",
                      today && "after:absolute after:inset-x-2 after:bottom-1 after:h-0.5 after:rounded-full after:bg-current",
                    )}
                  >
                    {Number(day.dateKey.slice(-2))}
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-[0.65rem] text-[var(--color-text-muted)]">
        {(Object.keys(stateLabels) as SogpCalendarState[]).map((state) => (
          <span key={state} className="inline-flex items-center gap-1.5">
            <span className={cn("size-2.5 rounded-sm border", stateClasses[state])} />
            {stateLabels[state]}
          </span>
        ))}
      </div>
    </div>
  );
}
