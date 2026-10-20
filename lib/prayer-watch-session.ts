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

/** The day's sessions as one line, "morning, another time", in the day's order. Null when none. */
export function prayerSessionsLine(sessions: string[]): string | null {
  const order = ["morning", "afternoon", "evening", PRAYER_WATCH_ANOTHER_TIME.id];
  const parts = order.filter(id => sessions.includes(id)).map(id => id === PRAYER_WATCH_ANOTHER_TIME.id ? "another time" : id);
  return parts.length ? parts.join(", ") : null;
}
