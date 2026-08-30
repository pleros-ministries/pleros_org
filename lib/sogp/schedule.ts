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
