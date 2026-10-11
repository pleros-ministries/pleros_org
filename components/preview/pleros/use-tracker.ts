"use client";

import { useState } from "react";

import { shiftDate } from "@/lib/sogp/daily-date";
import { trackerDays } from "@/lib/preview/pleros/daily-report";

import { DEMO_HISTORY_DAYS } from "./demo-context";

/** A seven-day window that contains the selected day and pages a week at a time. */
export function useTrackerWindow(day: string, today: string) {
  const earliestEnd = shiftDate(today, -(DEMO_HISTORY_DAYS - 6));
  const clamp = (value: string) => (value > today ? today : value < earliestEnd ? earliestEnd : value);
  const [end, setEnd] = useState(() => (day >= shiftDate(today, -6) ? today : clamp(shiftDate(day, 3))));

  // Keep the selected day in view when it changes from elsewhere (a link or the URL).
  const days = trackerDays(end);
  const visibleEnd = days.includes(day) ? end : clamp(shiftDate(day, 3));
  const visible = visibleEnd === end ? days : trackerDays(visibleEnd);

  return {
    days: visible,
    canShiftBack: visibleEnd > earliestEnd,
    shift: (direction: -1 | 1) => setEnd(clamp(shiftDate(visibleEnd, direction * 7))),
  };
}
