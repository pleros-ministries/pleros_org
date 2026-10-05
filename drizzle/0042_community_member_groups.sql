CREATE TYPE "public"."community_group_member_status" AS ENUM('active', 'pending', 'banned');--> statement-breakpoint
CREATE TYPE "public"."community_group_privacy" AS ENUM('public', 'private');--> statement-breakpoint
CREATE TYPE "public"."community_group_role" AS ENUM('owner', 'moderator', 'member');--> statement-breakpoint
ALTER TYPE "public"."community_notification_kind" ADD VALUE 'group_join_request';--> statement-breakpoint
ALTER TYPE "public"."community_notification_kind" ADD VALUE 'group_join_approved';--> statement-breakpoint
ALTER TYPE "public"."community_post_scope" ADD VALUE 'group';--> statement-breakpoint
CREATE TABLE "community_group_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"group_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"role" "community_group_role" DEFAULT 'member' NOT NULL,
	"status" "community_group_member_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"privacy" "community_group_privacy" DEFAULT 'public' NOT NULL,
	"status" "unit_status" DEFAULT 'active' NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "community_posts" ADD COLUMN "group_id" integer;--> statement-breakpoint
ALTER TABLE "community_group_members" ADD CONSTRAINT "community_group_members_group_id_community_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."community_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_group_members" ADD CONSTRAINT "community_group_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_groups" ADD CONSTRAINT "community_groups_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "community_group_members_group_user_idx" ON "community_group_members" USING btree ("group_id","user_id");--> statement-breakpoint
CREATE INDEX "community_group_members_user_status_idx" ON "community_group_members" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "community_group_members_group_status_idx" ON "community_group_members" USING btree ("group_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "community_groups_name_idx" ON "community_groups" USING btree (lower("name"));--> statement-breakpoint
CREATE INDEX "community_groups_status_idx" ON "community_groups" USING btree ("status");--> statement-breakpoint
ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_group_id_community_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."community_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "community_posts_group_activity_idx" ON "community_posts" USING btree ("group_id","last_activity_at");