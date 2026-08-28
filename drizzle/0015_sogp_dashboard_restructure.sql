CREATE TYPE "public"."sogp_review_completion_source" AS ENUM('live', 'recording');--> statement-breakpoint
CREATE TABLE "sogp_preparation_completions" (
	"id" serial PRIMARY KEY NOT NULL,
	"enrollment_id" integer NOT NULL,
	"preparation_day_id" integer NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sogp_cohorts" ALTER COLUMN "assessment_policy" SET DEFAULT '{"requiredTrackCompletionPercent":100,"requiredPrayerWatchPercent":80,"requiredLiveClassCount":4}'::jsonb;--> statement-breakpoint
UPDATE "sogp_cohorts"
SET "assessment_policy" =
  ("assessment_policy" - 'requiredPodcastDailyPercent') ||
  '{"requiredLiveClassCount":4}'::jsonb;--> statement-breakpoint
ALTER TABLE "sogp_live_class_attendance" ADD COLUMN "completion_source" "sogp_review_completion_source" DEFAULT 'live' NOT NULL;--> statement-breakpoint
ALTER TABLE "sogp_live_classes" ADD COLUMN "is_required" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "sogp_preparation_completions" ADD CONSTRAINT "sogp_preparation_completions_enrollment_id_sogp_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."sogp_enrollments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sogp_preparation_completions" ADD CONSTRAINT "sogp_preparation_completions_preparation_day_id_sogp_preparation_days_id_fk" FOREIGN KEY ("preparation_day_id") REFERENCES "public"."sogp_preparation_days"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "sogp_preparation_completion_enrollment_day_idx" ON "sogp_preparation_completions" USING btree ("enrollment_id","preparation_day_id");
