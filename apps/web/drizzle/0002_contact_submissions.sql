CREATE TYPE "public"."contact_submission_status" AS ENUM('new', 'read', 'resolved');--> statement-breakpoint
CREATE TABLE "contact_submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"location" text,
	"message" text NOT NULL,
	"status" "contact_submission_status" DEFAULT 'new' NOT NULL,
	"is_spam" boolean DEFAULT false NOT NULL,
	"spam_reasons" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"honeypot_value" text,
	"form_started_at" timestamp with time zone,
	"submit_duration_ms" integer,
	"notification_sent_at" timestamp with time zone,
	"notification_failure" text,
	"read_at" timestamp with time zone,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "contact_submissions_status_idx" ON "contact_submissions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "contact_submissions_is_spam_idx" ON "contact_submissions" USING btree ("is_spam");--> statement-breakpoint
CREATE INDEX "contact_submissions_created_at_idx" ON "contact_submissions" USING btree ("created_at");