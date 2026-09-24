CREATE TYPE "public"."sogp_learning_progress_share_kind" AS ENUM('image', 'video');--> statement-breakpoint
ALTER TABLE "sogp_learning_progress_shares" ALTER COLUMN "quote" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "sogp_learning_progress_shares" ADD COLUMN "kind" "sogp_learning_progress_share_kind" DEFAULT 'image' NOT NULL;