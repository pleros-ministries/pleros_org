CREATE TYPE "public"."sogp_learning_progress_share_template" AS ENUM('light-card', 'dark-open', 'dark-card');--> statement-breakpoint
ALTER TABLE "sogp_learning_progress_shares" ADD COLUMN "template" "sogp_learning_progress_share_template" DEFAULT 'light-card' NOT NULL;--> statement-breakpoint
ALTER TABLE "sogp_learning_progress_shares" ADD COLUMN "lesson_title" text;