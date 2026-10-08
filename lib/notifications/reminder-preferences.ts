import type { learnerNotificationPreferences } from "../db/schema";
import type { PrayerWatchSessionId } from "../prayer-watch";

import { LAGOS_TIME_ZONE, isValidTimeZone } from "./zoned-time";

/**
 * Learner notification preferences: types, defaults and form parsing.
 *
 * This file is imported by client components, so it must stay free of runtime
 * imports from `lib/db` (the schema import above is type-only).
 */

export type ReminderPreferenceRow =
  typeof learnerNotificationPreferences.$inferSelect;

export type ReminderPreferences = {
  timeZone: string;
  /** Minutes after local midnight; null until the learner chooses a time. */
  teachingTimeMinutes: number | null;
  teachingReminderEnabled: boolean;
  prayerWatch: Record<PrayerWatchSessionId, boolean>;
  communityEnabled: boolean;
  progressNudgesEnabled: boolean;
  newContentEnabled: boolean;
  weeklySummaryEnabled: boolean;
  appInstalledAt: Date | null;
  remindersSavedAt: Date | null;
};

/**
 * What a learner with no saved row receives. This equals what every learner
 * received before preferences existed, so nobody gains or loses a push until
 * they save the setup form.
 */
export const DEFAULT_REMINDER_PREFERENCES: ReminderPreferences = {
  timeZone: LAGOS_TIME_ZONE,
  teachingTimeMinutes: null,
  teachingReminderEnabled: false,
  prayerWatch: { morning: true, afternoon: false, evening: false },
  communityEnabled: true,
  progressNudgesEnabled: false,
  newContentEnabled: false,
  weeklySummaryEnabled: false,
  appInstalledAt: null,
  remindersSavedAt: null,
};

export function resolveReminderPreferences(
  row: ReminderPreferenceRow | null | undefined,
): ReminderPreferences {
  if (!row) {
    return {
      ...DEFAULT_REMINDER_PREFERENCES,
      prayerWatch: { ...DEFAULT_REMINDER_PREFERENCES.prayerWatch },
    };
  }

  return {
    timeZone: normaliseTimeZone(row.timeZone),
    teachingTimeMinutes: row.teachingTimeMinutes,
    teachingReminderEnabled: row.teachingReminderEnabled,
    prayerWatch: {
      morning: row.prayerWatchMorning,
      afternoon: row.prayerWatchAfternoon,
      evening: row.prayerWatchEvening,
    },
    communityEnabled: row.communityEnabled,
    progressNudgesEnabled: row.progressNudgesEnabled,
    newContentEnabled: row.newContentEnabled,
    weeklySummaryEnabled: row.weeklySummaryEnabled,
    appInstalledAt: row.appInstalledAt,
    remindersSavedAt: row.remindersSavedAt,
  };
}

export function normaliseTimeZone(value: unknown): string {
  return isValidTimeZone(value) ? value : LAGOS_TIME_ZONE;
}

const TEACHING_TIME_PATTERN =
  /^([01]\d|2[0-3]):([0-5]\d)(?::[0-5]\d(?:\.\d+)?)?$/;

/**
 * `<input type="time">` value → minutes after midnight. Seconds are accepted
 * and dropped, and any minute is allowed, because some browsers ignore `step`.
 */
export function parseTeachingTime(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const match = TEACHING_TIME_PATTERN.exec(value.trim());
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

/** Minutes after midnight → the `HH:MM` an `<input type="time">` expects. */
export function formatTeachingTimeValue(minutes: number | null): string {
  if (minutes === null) return "";
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

// ─── Setup form ─────────────────────────────────────────────────────────────

/** Field names shared by the setup forms and the server actions. */
export const REMINDER_FORM_FIELDS = {
  teachingTime: "teachingTime",
  timeZone: "timeZone",
  prayerWatchMorning: "prayerWatchMorning",
  prayerWatchAfternoon: "prayerWatchAfternoon",
  prayerWatchEvening: "prayerWatchEvening",
  teachingReminder: "teachingReminder",
  community: "community",
  progressNudges: "progressNudges",
  newContent: "newContent",
  weeklySummary: "weeklySummary",
} as const;

export type ReminderChoices = {
  prayerWatch: Record<PrayerWatchSessionId, boolean>;
  teachingReminderEnabled: boolean;
  communityEnabled: boolean;
  progressNudgesEnabled: boolean;
  newContentEnabled: boolean;
  weeklySummaryEnabled: boolean;
};

/** Reads the reminders form; an unticked checkbox is simply absent. */
export function parseReminderChoices(formData: FormData): ReminderChoices {
  const ticked = (name: string) => formData.get(name) === "on";
  return {
    prayerWatch: {
      morning: ticked(REMINDER_FORM_FIELDS.prayerWatchMorning),
      afternoon: ticked(REMINDER_FORM_FIELDS.prayerWatchAfternoon),
      evening: ticked(REMINDER_FORM_FIELDS.prayerWatchEvening),
    },
    teachingReminderEnabled: ticked(REMINDER_FORM_FIELDS.teachingReminder),
    communityEnabled: ticked(REMINDER_FORM_FIELDS.community),
    progressNudgesEnabled: ticked(REMINDER_FORM_FIELDS.progressNudges),
    newContentEnabled: ticked(REMINDER_FORM_FIELDS.newContent),
    weeklySummaryEnabled: ticked(REMINDER_FORM_FIELDS.weeklySummary),
  };
}

/**
 * What the setup page needs, in plain serialisable values. The server page
 * builds it and hands it to the client steps.
 */
export type ReminderSetupView = {
  timeZone: string;
  /** `HH:MM`, or an empty string when no time has been chosen. */
  teachingTime: string;
  teachingTimeMinutes: number | null;
  appInstalled: boolean;
  remindersSaved: boolean;
  choices: ReminderChoices;
};

/**
 * The ticks shown before the learner has ever saved the reminders step: the
 * recommended set. Nothing in it is sent until they press save.
 */
export const RECOMMENDED_REMINDER_CHOICES: ReminderChoices = {
  prayerWatch: { morning: true, afternoon: false, evening: false },
  teachingReminderEnabled: true,
  communityEnabled: true,
  progressNudgesEnabled: true,
  newContentEnabled: true,
  weeklySummaryEnabled: true,
};

export function toReminderSetupView(
  preferences: ReminderPreferences,
): ReminderSetupView {
  const remindersSaved = preferences.remindersSavedAt !== null;
  const choices: ReminderChoices = remindersSaved
    ? {
        prayerWatch: { ...preferences.prayerWatch },
        teachingReminderEnabled: preferences.teachingReminderEnabled,
        communityEnabled: preferences.communityEnabled,
        progressNudgesEnabled: preferences.progressNudgesEnabled,
        newContentEnabled: preferences.newContentEnabled,
        weeklySummaryEnabled: preferences.weeklySummaryEnabled,
      }
    : {
        ...RECOMMENDED_REMINDER_CHOICES,
        prayerWatch: { ...RECOMMENDED_REMINDER_CHOICES.prayerWatch },
      };

  return {
    timeZone: preferences.timeZone,
    teachingTime: formatTeachingTimeValue(preferences.teachingTimeMinutes),
    teachingTimeMinutes: preferences.teachingTimeMinutes,
    appInstalled: preferences.appInstalledAt !== null,
    remindersSaved,
    choices,
  };
}

// ─── Server action contract ─────────────────────────────────────────────────

export type ReminderActionState = {
  error: string | null;
  /** ISO time of the last successful save, so the form can confirm it. */
  savedAt: string | null;
};

export const INITIAL_REMINDER_ACTION_STATE: ReminderActionState = {
  error: null,
  savedAt: null,
};

export type ReminderFormAction = (
  previousState: ReminderActionState,
  formData: FormData,
) => Promise<ReminderActionState>;

/**
 * The server actions the setup steps call. The live route passes them in as
 * props; the preview passes none and the steps fall back to no-ops.
 */
export type ReminderSetupActions = {
  saveTeachingTime: ReminderFormAction;
  saveReminderPreferences: ReminderFormAction;
  markAppInstalled: () => Promise<ReminderActionState>;
};
