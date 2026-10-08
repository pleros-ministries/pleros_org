import { readFileSync } from "node:fs";
import { join } from "node:path";

import { getTableColumns, getTableName } from "drizzle-orm";
import { expect, test } from "vitest";

import { learnerNotificationPreferences } from "../db/schema";

test("stores one notification preference row per learner", () => {
  expect(getTableName(learnerNotificationPreferences)).toBe(
    "learner_notification_preferences",
  );

  const columns = getTableColumns(learnerNotificationPreferences);
  expect(Object.values(columns).map((column) => column.name)).toEqual([
    "user_id",
    "time_zone",
    "teaching_time_minutes",
    "teaching_reminder_enabled",
    "prayer_watch_morning",
    "prayer_watch_afternoon",
    "prayer_watch_evening",
    "community_enabled",
    "progress_nudges_enabled",
    "new_content_enabled",
    "weekly_summary_enabled",
    "app_installed_at",
    "reminders_saved_at",
    "created_at",
    "updated_at",
  ]);
  expect(columns.userId.primary).toBe(true);
});

test("defaults match what learners received before preferences existed", () => {
  const columns = getTableColumns(learnerNotificationPreferences);

  // On by default: the morning Prayer Watch reminder and community pushes.
  expect(columns.prayerWatchMorning.default).toBe(true);
  expect(columns.communityEnabled.default).toBe(true);
  // Everything new stays off until the learner saves the setup form.
  expect(columns.prayerWatchAfternoon.default).toBe(false);
  expect(columns.prayerWatchEvening.default).toBe(false);
  expect(columns.teachingReminderEnabled.default).toBe(false);
  expect(columns.progressNudgesEnabled.default).toBe(false);
  expect(columns.newContentEnabled.default).toBe(false);
  expect(columns.weeklySummaryEnabled.default).toBe(false);
  expect(columns.timeZone.default).toBe("Africa/Lagos");
});

test("the migration only adds the preferences table", () => {
  const migration = readFileSync(
    join(
      process.cwd(),
      "drizzle",
      "0048_learner_notification_preferences.sql",
    ),
    "utf8",
  );

  expect(migration).toContain('CREATE TABLE "learner_notification_preferences"');
  expect(migration.match(/CREATE TABLE/g)).toHaveLength(1);
  expect(migration).toContain(
    'FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade',
  );
  expect(migration).not.toMatch(/\bDROP\b/);
  expect(migration).not.toMatch(/ALTER TABLE "(?!learner_notification_preferences")/);
});
