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
