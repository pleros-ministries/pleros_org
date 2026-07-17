export const PRAYER_WATCH_YOUTUBE_URL = "https://youtube.com/@PlerosLive";

// Pleros Prayer Watch — Evening Session, the channel's most recent stream
export const PRAYER_WATCH_FEATURED_VIDEO_ID = "eX95LNHmyg0";
export const PRAYER_WATCH_EMBED_URL = `https://www.youtube.com/embed/${PRAYER_WATCH_FEATURED_VIDEO_ID}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
export const PRAYER_WATCH_THUMBNAIL_URL = `https://i.ytimg.com/vi/${PRAYER_WATCH_FEATURED_VIDEO_ID}/hqdefault.jpg`;

export type PrayerWatchDayState = "future" | "attended" | "missed";

export type PrayerWatchCalendarCell = {
  dateKey: string;
  day: number;
  inCurrentMonth: boolean;
  isToday: boolean;
  state: PrayerWatchDayState;
};

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getMonthLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function buildCell(
  date: Date,
  inCurrentMonth: boolean,
  attended: Set<string>,
  todayKey: string,
): PrayerWatchCalendarCell {
  const dateKey = toDateKey(date);
  const state: PrayerWatchDayState =
    dateKey > todayKey ? "future" : attended.has(dateKey) ? "attended" : "missed";

  return {
    dateKey,
    day: date.getDate(),
    inCurrentMonth,
    isToday: dateKey === todayKey,
    state,
  };
}

export function buildPrayerWatchCalendar({
  year,
  month,
  attendedDateKeys,
  todayKey,
}: {
  year: number;
  month: number;
  attendedDateKeys: Iterable<string>;
  todayKey: string;
}): PrayerWatchCalendarCell[][] {
  const attended = new Set(attendedDateKeys);
  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = firstOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: PrayerWatchCalendarCell[] = [];

  for (let i = 0; i < startWeekday; i += 1) {
    const date = new Date(year, month, i - startWeekday + 1);
    cells.push(buildCell(date, false, attended, todayKey));
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(buildCell(new Date(year, month, day), true, attended, todayKey));
  }

  let trailingDay = 1;
  while (cells.length % 7 !== 0) {
    cells.push(buildCell(new Date(year, month + 1, trailingDay), false, attended, todayKey));
    trailingDay += 1;
  }

  const weeks: PrayerWatchCalendarCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return weeks;
}

export function isValidPrayerWatchDateKey(value: string, todayKey: string): boolean {
  if (!DATE_KEY_PATTERN.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  const isRealCalendarDate =
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;

  return isRealCalendarDate && value <= todayKey;
}
