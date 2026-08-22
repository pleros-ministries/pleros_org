import type { PrayerWatchSessionId } from "./prayer-watch";

const LOGGABLE_PRAYER_WATCH_SESSIONS = new Set<PrayerWatchSessionId>([
  "morning",
  "afternoon",
  "evening",
]);

export function isPrayerWatchSession(
  value: string,
): value is PrayerWatchSessionId {
  return LOGGABLE_PRAYER_WATCH_SESSIONS.has(value as PrayerWatchSessionId);
}
