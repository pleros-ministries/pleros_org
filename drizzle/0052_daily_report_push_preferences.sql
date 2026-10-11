ALTER TYPE "public"."community_notification_kind" ADD VALUE 'daily_report_reminder' BEFORE 'discipleship_joined';--> statement-breakpoint
CREATE TABLE "daily_report_preferences" (
	"user_id" text PRIMARY KEY NOT NULL,
	"push_enabled" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "daily_report_preferences" ADD CONSTRAINT "daily_report_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;