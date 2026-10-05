CREATE TYPE "public"."community_post_kind" AS ENUM('official', 'discussion');--> statement-breakpoint
ALTER TABLE "community_posts" ADD COLUMN "kind" "community_post_kind" DEFAULT 'official' NOT NULL;--> statement-breakpoint
ALTER TABLE "community_posts" ADD COLUMN "topic" text;--> statement-breakpoint
CREATE INDEX "community_posts_kind_activity_idx" ON "community_posts" USING btree ("kind","last_activity_at");