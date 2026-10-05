ALTER TYPE "public"."community_notification_kind" ADD VALUE 'discipleship_post';--> statement-breakpoint
ALTER TYPE "public"."community_post_scope" ADD VALUE 'discipleship';--> statement-breakpoint
ALTER TABLE "community_posts" ADD COLUMN "discipleship_group_id" integer;--> statement-breakpoint
ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_discipleship_group_id_discipleship_groups_id_fk" FOREIGN KEY ("discipleship_group_id") REFERENCES "public"."discipleship_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "community_posts_discipleship_activity_idx" ON "community_posts" USING btree ("discipleship_group_id","last_activity_at");