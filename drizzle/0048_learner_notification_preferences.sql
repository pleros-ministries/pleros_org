CREATE TABLE "learner_notification_preferences" (
	"user_id" text PRIMARY KEY NOT NULL,
	"time_zone" text DEFAULT 'Africa/Lagos' NOT NULL,
	"teaching_time_minutes" integer,
	"teaching_reminder_enabled" boolean DEFAULT false NOT NULL,
	"prayer_watch_morning" boolean DEFAULT true NOT NULL,
	"prayer_watch_afternoon" boolean DEFAULT false NOT NULL,
	"prayer_watch_evening" boolean DEFAULT false NOT NULL,
	"community_enabled" boolean DEFAULT true NOT NULL,
	"progress_nudges_enabled" boolean DEFAULT false NOT NULL,
	"new_content_enabled" boolean DEFAULT false NOT NULL,
	"weekly_summary_enabled" boolean DEFAULT false NOT NULL,
	"app_installed_at" timestamp with time zone,
	"reminders_saved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "learner_notification_preferences" ADD CONSTRAINT "learner_notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;