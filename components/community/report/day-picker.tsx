import Link from "next/link";

import { dateKeyLabel } from "@/lib/community/time";
import { shiftDate } from "@/lib/sogp/daily-date";

const BASE = "/dashboard/community/report";

/** "Today", "Yesterday", or the date. */
export function dayName(dateKey: string, today: string): string {
  if (dateKey === today) return "Today";
  if (dateKey === shiftDate(today, -1)) return "Yesterday";
  return dateKeyLabel(dateKey);
}

/** The Report tab for a day, optionally with a one-off "saved" or "removed" message. */
export function dayHref(
  dateKey: string,
  today: string,
  flash?: "saved" | "removed",
): string {
  const params = new URLSearchParams();
  if (dateKey !== today) params.set("day", dateKey);
  if (flash) params.set(flash, "1");
  const query = params.toString();
  return query ? `${BASE}?${query}` : BASE;
}

/** The days that can still be reported, today first, as a pill of links. */
export function DayPicker({
  today,
  days,
  selected,
}: {
  today: string;
  days: string[];
  selected: string;
}) {
  return (
    <nav
      aria-label="Choose a day"
      className="flex w-fit items-center gap-0.5 rounded-full border border-(--color-line-strong) bg-white p-0.5"
    >
      {days.map((dateKey) => {
        const active = dateKey === selected;
        return (
          <Link
            key={dateKey}
            href={dayHref(dateKey, today)}
            aria-current={active ? "page" : undefined}
            className={`inline-flex h-8 items-center rounded-full px-3.5 text-[13px] font-medium transition-colors ${
              active
                ? "bg-(--color-brand-blue) text-white"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            {dayName(dateKey, today)}
          </Link>
        );
      })}
    </nav>
  );
}
