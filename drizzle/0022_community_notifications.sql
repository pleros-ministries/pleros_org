CREATE TYPE "public"."community_notification_kind" AS ENUM('official_post', 'thread_reply', 'message_reply', 'made_leader', 'flag_resolved', 'leader_nudge');--> statement-breakpoint
CREATE TABLE "community_notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"kind" "community_notification_kind" NOT NULL,
	"payload" jsonb NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "community_notifications" ADD CONSTRAINT "community_notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "community_notifications_user_created_idx" ON "community_notifications" USING btree ("user_id","created_at");