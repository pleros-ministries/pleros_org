CREATE TYPE "public"."prayer_watch_session" AS ENUM('unspecified', 'morning', 'afternoon', 'evening');--> statement-breakpoint
DROP INDEX "prayer_watch_attendance_user_date_idx";--> statement-breakpoint
ALTER TABLE "sogp_cohorts" ALTER COLUMN "assessment_policy" SET DEFAULT '{"requiredTrackCompletionPercent":100,"requiredPrayerWatchPercent":80,"requiredPodcastDailyPercent":100,"requiredLiveClassCount":0}'::jsonb;--> statement-breakpoint
UPDATE "sogp_cohorts" SET "assessment_policy" = "assessment_policy" || '{"requiredPodcastDailyPercent":100}'::jsonb WHERE NOT ("assessment_policy" ? 'requiredPodcastDailyPercent');--> statement-breakpoint
ALTER TABLE "prayer_watch_attendance" ADD COLUMN "session" "prayer_watch_session" DEFAULT 'unspecified' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "prayer_watch_attendance_user_date_session_idx" ON "prayer_watch_attendance" USING btree ("user_id","attended_date","session");
