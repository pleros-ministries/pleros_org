export function buildWeekdayReleaseDates(startsAt: Date, count: number) {
  const dates: Date[] = [];
  const cursor = new Date(startsAt);

  while (dates.length < count) {
    const day = cursor.getUTCDay();
    if (day !== 0 && day !== 6) dates.push(new Date(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return dates;
}

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1_000;

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * DAY_IN_MILLISECONDS);
}

// A cohort's `startsAt` is stored as the UTC instant of Lagos midnight,
// which can fall on the previous UTC calendar day (e.g. 2026-09-14T00:00
// Lagos is 2026-09-13T23:00 UTC). Naively calling `setUTCHours` on that
// value keeps the UTC date component and silently shifts the release
// schedule a day earlier, tripping `assertMondayCohortStart`. Resolve the
// Lagos calendar date first, then anchor releases to 05:00 UTC that day.
export function resolveFirstReleaseAt(startsAt: Date) {
  const lagosDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(startsAt);

  return new Date(`${lagosDate}T05:00:00Z`);
}

export function assertMondayCohortStart(startsAt: Date) {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Lagos",
    weekday: "short",
  }).format(startsAt);

  if (weekday !== "Mon") {
    throw new Error("SOGP cohorts must start on Monday.");
  }
}

export function buildSogpTrackReleaseDates(startsAt: Date) {
  assertMondayCohortStart(startsAt);

  return Array.from({ length: 24 }, (_, index) => {
    const weekIndex = Math.floor(index / 6);
    const dayIndex = index % 6;
    return addDays(startsAt, weekIndex * 7 + dayIndex);
  });
}

export function buildSogpReviewDates(startsAt: Date) {
  assertMondayCohortStart(startsAt);

  return Array.from({ length: 4 }, (_, weekIndex) =>
    addDays(startsAt, weekIndex * 7 + 6),
  );
}
