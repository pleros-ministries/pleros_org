import { describe, expect, test } from "vitest";

import {
  DEFAULT_REMINDER_PREFERENCES,
  RECOMMENDED_REMINDER_CHOICES,
  REMINDER_FORM_FIELDS,
  formatTeachingTimeValue,
  normaliseTimeZone,
  parseReminderChoices,
  parseTeachingTime,
  resolveReminderPreferences,
  toReminderSetupView,
  type ReminderPreferenceRow,
} from "./reminder-preferences";

function row(overrides: Partial<ReminderPreferenceRow> = {}): ReminderPreferenceRow {
  return {
    userId: "user-1",
    timeZone: "America/New_York",
    teachingTimeMinutes: 390,
    teachingReminderEnabled: true,
    prayerWatchMorning: false,
    prayerWatchAfternoon: true,
    prayerWatchEvening: true,
    communityEnabled: false,
    progressNudgesEnabled: true,
    newContentEnabled: true,
    weeklySummaryEnabled: true,
    appInstalledAt: new Date("2026-10-01T10:00:00Z"),
    remindersSavedAt: new Date("2026-10-02T10:00:00Z"),
    createdAt: new Date("2026-10-01T09:00:00Z"),
    updatedAt: new Date("2026-10-02T10:00:00Z"),
    ...overrides,
  };
}

describe("resolving saved preferences", () => {
  test("a learner with no row keeps what they received before preferences existed", () => {
    const preferences = resolveReminderPreferences(null);

    expect(preferences).toEqual(DEFAULT_REMINDER_PREFERENCES);
    // Morning Prayer Watch and community pushes on; nothing new.
    expect(preferences.prayerWatch).toEqual({
      morning: true,
      afternoon: false,
      evening: false,
    });
    expect(preferences.communityEnabled).toBe(true);
    expect(preferences.teachingReminderEnabled).toBe(false);
    expect(preferences.progressNudgesEnabled).toBe(false);
    expect(preferences.newContentEnabled).toBe(false);
    expect(preferences.weeklySummaryEnabled).toBe(false);
    expect(resolveReminderPreferences(undefined)).toEqual(DEFAULT_REMINDER_PREFERENCES);
  });

  test("never hands out the shared default objects", () => {
    const first = resolveReminderPreferences(null);
    first.prayerWatch.evening = true;

    expect(resolveReminderPreferences(null).prayerWatch.evening).toBe(false);
    expect(DEFAULT_REMINDER_PREFERENCES.prayerWatch.evening).toBe(false);
  });

  test("maps every stored column", () => {
    const stored = row();

    expect(resolveReminderPreferences(stored)).toEqual({
      timeZone: "America/New_York",
      teachingTimeMinutes: 390,
      teachingReminderEnabled: true,
      prayerWatch: { morning: false, afternoon: true, evening: true },
      communityEnabled: false,
      progressNudgesEnabled: true,
      newContentEnabled: true,
      weeklySummaryEnabled: true,
      appInstalledAt: stored.appInstalledAt,
      remindersSavedAt: stored.remindersSavedAt,
    });
  });

  test("falls back to Lagos when the stored zone is no longer valid", () => {
    expect(resolveReminderPreferences(row({ timeZone: "Mars/Olympus" })).timeZone).toBe(
      "Africa/Lagos",
    );
    expect(normaliseTimeZone("Europe/London")).toBe("Europe/London");
    expect(normaliseTimeZone(undefined)).toBe("Africa/Lagos");
    expect(normaliseTimeZone(null)).toBe("Africa/Lagos");
  });
});

describe("teaching time input", () => {
  test("accepts any valid time, with or without seconds", () => {
    expect(parseTeachingTime("06:30")).toBe(390);
    // Some browsers ignore the five-minute step.
    expect(parseTeachingTime("06:33")).toBe(393);
    expect(parseTeachingTime("06:30:00")).toBe(390);
    expect(parseTeachingTime("00:00")).toBe(0);
    expect(parseTeachingTime("23:59")).toBe(1439);
    expect(parseTeachingTime(" 19:05 ")).toBe(1145);
  });

  test("rejects anything that is not a time of day", () => {
    expect(parseTeachingTime("6:30")).toBeNull();
    expect(parseTeachingTime("24:00")).toBeNull();
    expect(parseTeachingTime("12:60")).toBeNull();
    expect(parseTeachingTime("")).toBeNull();
    expect(parseTeachingTime(null)).toBeNull();
    expect(parseTeachingTime(390)).toBeNull();
  });

  test("formats minutes back into the value a time input expects", () => {
    expect(formatTeachingTimeValue(390)).toBe("06:30");
    expect(formatTeachingTimeValue(0)).toBe("00:00");
    expect(formatTeachingTimeValue(1439)).toBe("23:59");
    expect(formatTeachingTimeValue(null)).toBe("");
    expect(parseTeachingTime(formatTeachingTimeValue(1145))).toBe(1145);
  });
});

describe("the reminders form", () => {
  test("treats a ticked box as on and a missing one as off", () => {
    const formData = new FormData();
    formData.set(REMINDER_FORM_FIELDS.prayerWatchEvening, "on");
    formData.set(REMINDER_FORM_FIELDS.teachingReminder, "on");
    formData.set(REMINDER_FORM_FIELDS.weeklySummary, "on");

    expect(parseReminderChoices(formData)).toEqual({
      prayerWatch: { morning: false, afternoon: false, evening: true },
      teachingReminderEnabled: true,
      communityEnabled: false,
      progressNudgesEnabled: false,
      newContentEnabled: false,
      weeklySummaryEnabled: true,
    });
  });

  test("an empty form switches everything off", () => {
    expect(parseReminderChoices(new FormData())).toEqual({
      prayerWatch: { morning: false, afternoon: false, evening: false },
      teachingReminderEnabled: false,
      communityEnabled: false,
      progressNudgesEnabled: false,
      newContentEnabled: false,
      weeklySummaryEnabled: false,
    });
  });
});

describe("what the setup page shows", () => {
  test("shows the recommended ticks until the learner first saves", () => {
    const view = toReminderSetupView(resolveReminderPreferences(null));

    expect(view.remindersSaved).toBe(false);
    expect(view.appInstalled).toBe(false);
    expect(view.teachingTime).toBe("");
    expect(view.teachingTimeMinutes).toBeNull();
    expect(view.choices).toEqual(RECOMMENDED_REMINDER_CHOICES);
    // The recommendation pre-ticks the new kinds; nothing is sent until saved.
    expect(view.choices.progressNudgesEnabled).toBe(true);
    expect(view.choices.newContentEnabled).toBe(true);
    expect(view.choices.weeklySummaryEnabled).toBe(true);
    expect(view.choices.prayerWatch).not.toBe(RECOMMENDED_REMINDER_CHOICES.prayerWatch);
  });

  test("shows the stored choices once the learner has saved", () => {
    const view = toReminderSetupView(
      resolveReminderPreferences(
        row({ progressNudgesEnabled: false, newContentEnabled: false }),
      ),
    );

    expect(view.remindersSaved).toBe(true);
    expect(view.appInstalled).toBe(true);
    expect(view.timeZone).toBe("America/New_York");
    expect(view.teachingTime).toBe("06:30");
    expect(view.teachingTimeMinutes).toBe(390);
    expect(view.choices).toEqual({
      prayerWatch: { morning: false, afternoon: true, evening: true },
      teachingReminderEnabled: true,
      communityEnabled: false,
      progressNudgesEnabled: false,
      newContentEnabled: false,
      weeklySummaryEnabled: true,
    });
  });

  test("a time saved before the reminders step keeps the recommended ticks", () => {
    const view = toReminderSetupView(
      resolveReminderPreferences(row({ remindersSavedAt: null })),
    );

    expect(view.remindersSaved).toBe(false);
    expect(view.teachingTime).toBe("06:30");
    expect(view.choices).toEqual(RECOMMENDED_REMINDER_CHOICES);
  });
});
