/** Date labels for community surfaces. Africa/Lagos is the programme's clock. */

const TIME_ZONE = "Africa/Lagos";

const dayMonthFmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  timeZone: TIME_ZONE,
});

const clockFmt = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: TIME_ZONE,
});

const dateKeyFmt = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: TIME_ZONE,
});

/** "just now", "5m", "3h", "2d", then "4 Oct". */
export function relativeTime(iso: string, now: number = Date.now()): string {
  const diff = now - new Date(iso).getTime();
  const min = Math.round(diff / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day}d`;
  return dayMonthFmt.format(new Date(iso));
}

/** "14:05" in Lagos time. */
export function clockTime(iso: string): string {
  return clockFmt.format(new Date(iso));
}

/** Stable per-day key ("2026-10-04") for grouping messages. */
export function dayKey(iso: string): string {
  return dateKeyFmt.format(new Date(iso));
}

/** "Today", "Yesterday", or "4 Oct" — the separator between days in a thread. */
export function dayLabel(iso: string, now: number = Date.now()): string {
  const key = dayKey(iso);
  if (key === dayKey(new Date(now).toISOString())) return "Today";
  if (key === dayKey(new Date(now - 86_400_000).toISOString())) {
    return "Yesterday";
  }
  return dayMonthFmt.format(new Date(iso));
}

const dateKeyLabelFmt = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

/** "Mon 5 Oct" for a calendar date key such as "2026-10-05". */
export function dateKeyLabel(dateKey: string): string {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  return Number.isNaN(date.getTime())
    ? dateKey
    : dateKeyLabelFmt.format(date).replace(",", "");
}
