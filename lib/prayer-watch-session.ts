import type { PrayerWatchSessionId } from "./prayer-watch";

const LOGGABLE_PRAYER_WATCH_SESSIONS = new Set<PrayerWatchSessionId>([
  "morning",
  "afternoon",
  "evening",
]);

/**
 * "Another time" (user request, 20 October): prayer joined outside the three
 * sessions, stored as the `unspecified` session that older logs already use.
 */
export const PRAYER_WATCH_ANOTHER_TIME = { id: "unspecified", label: "Another time" } as const;
export type LoggablePrayerSessionId = PrayerWatchSessionId | typeof PRAYER_WATCH_ANOTHER_TIME.id;

/** A session someone can tick on My reports or the Prayer Watch page, including "Another time". */
export function isLoggablePrayerSession(value: string): value is LoggablePrayerSessionId {
  return value === PRAYER_WATCH_ANOTHER_TIME.id || isPrayerWatchSession(value);
}

export function isPrayerWatchSession(
  value: string,
): value is PrayerWatchSessionId {
  return LOGGABLE_PRAYER_WATCH_SESSIONS.has(value as PrayerWatchSessionId);
}

const clock = new Intl.DateTimeFormat("en-GB", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "UTC" });

/**
 * The day's sessions as one line, "morning, 10:15 pm", in the day's order.
 * Times saved under Another time replace the words "another time". Null when none.
 */
export function prayerSessionsLine(sessions: string[], times: string[] = []): string | null {
  const named = ["morning", "afternoon", "evening"].filter(id => sessions.includes(id));
  const other = times.length
    ? [...times].sort().map(time => clock.format(new Date(`1970-01-01T${time}:00Z`)).replace(/\s/g, " ").toLowerCase())
    : sessions.includes(PRAYER_WATCH_ANOTHER_TIME.id) ? ["another time"] : [];
  const parts = [...named, ...other];
  return parts.length ? parts.join(", ") : null;
}
