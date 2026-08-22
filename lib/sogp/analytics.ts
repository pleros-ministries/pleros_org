export type SogpAnalyticsEvent =
  | "sogp_landing_view"
  | "sogp_enrolment_started"
  | "sogp_enrolment_completed"
  | "sogp_telegram_connected"
  | "sogp_track_started"
  | "sogp_track_completed"
  | "sogp_live_class_opened"
  | "sogp_certificate_issued";

const BLOCKED_KEYS = new Set([
  "name",
  "email",
  "phone",
  "telegramUserId",
  "telegramChatId",
  "content",
  "response",
]);

export function sanitizeSogpAnalyticsPayload(
  payload: Record<string, string | number | boolean | null | undefined>,
) {
  return Object.fromEntries(
    Object.entries(payload).filter(
      ([key, value]) => !BLOCKED_KEYS.has(key) && value !== undefined,
    ),
  );
}
