CREATE TYPE "public"."sogp_cohort_status" AS ENUM('draft', 'enrollment_open', 'preparing', 'active', 'completed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."sogp_enrollment_status" AS ENUM('enrolled', 'preparing', 'active', 'carryover', 'completed', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."sogp_live_class_status" AS ENUM('scheduled', 'live', 'completed', 'cancelled');--> statement-breakpoint
CREATE TABLE "sogp_certificates" (
	"id" serial PRIMARY KEY NOT NULL,
	"enrollment_id" integer NOT NULL,
	"verification_code" text NOT NULL,
	"issued_by" text,
	"override_reason" text,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sogp_cohort_tracks" (
	"id" serial PRIMARY KEY NOT NULL,
	"cohort_id" integer NOT NULL,
	"lesson_id" integer NOT NULL,
	"day_number" integer NOT NULL,
	"week_number" integer NOT NULL,
	"release_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sogp_cohorts" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"status" "sogp_cohort_status" DEFAULT 'draft' NOT NULL,
	"enrollment_opens_at" timestamp with time zone,
	"enrollment_closes_at" timestamp with time zone,
	"preparation_starts_at" timestamp with time zone,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"telegram_channel_url" text,
	"telegram_discussion_url" text,
	"telegram_bot_username" text,
	"assessment_policy" jsonb DEFAULT '{"requiredTrackCompletionPercent":100,"requiredPrayerWatchPercent":80,"requiredLiveClassCount":0}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sogp_enrollments" (
	"id" serial PRIMARY KEY NOT NULL,
	"cohort_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"country" text NOT NULL,
	"reason" text,
	"status" "sogp_enrollment_status" DEFAULT 'enrolled' NOT NULL,
	"utm_source" text,
	"utm_medium" text,
	"utm_campaign" text,
	"utm_content" text,
	"utm_term" text,
	"telegram_link_token_hash" text,
	"telegram_user_id" text,
	"telegram_chat_id" text,
	"telegram_linked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sogp_live_class_attendance" (
	"id" serial PRIMARY KEY NOT NULL,
	"live_class_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"attended_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sogp_live_classes" (
	"id" serial PRIMARY KEY NOT NULL,
	"cohort_id" integer NOT NULL,
	"title" text NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"youtube_live_url" text,
	"recording_url" text,
	"status" "sogp_live_class_status" DEFAULT 'scheduled' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sogp_reward_grants" (
	"id" serial PRIMARY KEY NOT NULL,
	"enrollment_id" integer NOT NULL,
	"reward_key" text NOT NULL,
	"label" text NOT NULL,
	"granted_by" text,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sogp_certificates" ADD CONSTRAINT "sogp_certificates_enrollment_id_sogp_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."sogp_enrollments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sogp_certificates" ADD CONSTRAINT "sogp_certificates_issued_by_users_id_fk" FOREIGN KEY ("issued_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sogp_cohort_tracks" ADD CONSTRAINT "sogp_cohort_tracks_cohort_id_sogp_cohorts_id_fk" FOREIGN KEY ("cohort_id") REFERENCES "public"."sogp_cohorts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sogp_cohort_tracks" ADD CONSTRAINT "sogp_cohort_tracks_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sogp_enrollments" ADD CONSTRAINT "sogp_enrollments_cohort_id_sogp_cohorts_id_fk" FOREIGN KEY ("cohort_id") REFERENCES "public"."sogp_cohorts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sogp_enrollments" ADD CONSTRAINT "sogp_enrollments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sogp_live_class_attendance" ADD CONSTRAINT "sogp_live_class_attendance_live_class_id_sogp_live_classes_id_fk" FOREIGN KEY ("live_class_id") REFERENCES "public"."sogp_live_classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sogp_live_class_attendance" ADD CONSTRAINT "sogp_live_class_attendance_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sogp_live_classes" ADD CONSTRAINT "sogp_live_classes_cohort_id_sogp_cohorts_id_fk" FOREIGN KEY ("cohort_id") REFERENCES "public"."sogp_cohorts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sogp_reward_grants" ADD CONSTRAINT "sogp_reward_grants_enrollment_id_sogp_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."sogp_enrollments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sogp_reward_grants" ADD CONSTRAINT "sogp_reward_grants_granted_by_users_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "sogp_certificates_enrollment_idx" ON "sogp_certificates" USING btree ("enrollment_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sogp_certificates_verification_idx" ON "sogp_certificates" USING btree ("verification_code");--> statement-breakpoint
CREATE UNIQUE INDEX "sogp_cohort_tracks_cohort_day_idx" ON "sogp_cohort_tracks" USING btree ("cohort_id","day_number");--> statement-breakpoint
CREATE UNIQUE INDEX "sogp_cohort_tracks_cohort_lesson_idx" ON "sogp_cohort_tracks" USING btree ("cohort_id","lesson_id");--> statement-breakpoint
CREATE INDEX "sogp_cohort_tracks_release_idx" ON "sogp_cohort_tracks" USING btree ("release_at");--> statement-breakpoint
CREATE UNIQUE INDEX "sogp_cohorts_slug_idx" ON "sogp_cohorts" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "sogp_cohorts_status_idx" ON "sogp_cohorts" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "sogp_enrollments_cohort_user_idx" ON "sogp_enrollments" USING btree ("cohort_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sogp_enrollments_cohort_email_idx" ON "sogp_enrollments" USING btree ("cohort_id","email");--> statement-breakpoint
CREATE INDEX "sogp_enrollments_status_idx" ON "sogp_enrollments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "sogp_enrollments_telegram_user_idx" ON "sogp_enrollments" USING btree ("telegram_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sogp_live_class_attendance_class_user_idx" ON "sogp_live_class_attendance" USING btree ("live_class_id","user_id");--> statement-breakpoint
CREATE INDEX "sogp_live_class_attendance_user_idx" ON "sogp_live_class_attendance" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sogp_live_classes_cohort_idx" ON "sogp_live_classes" USING btree ("cohort_id");--> statement-breakpoint
CREATE INDEX "sogp_live_classes_starts_at_idx" ON "sogp_live_classes" USING btree ("starts_at");--> statement-breakpoint
CREATE UNIQUE INDEX "sogp_reward_grants_enrollment_reward_idx" ON "sogp_reward_grants" USING btree ("enrollment_id","reward_key");