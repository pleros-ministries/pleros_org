CREATE TYPE "public"."discipleship_group_status" AS ENUM('active', 'archived');--> statement-breakpoint
CREATE TYPE "public"."discipleship_membership_status" AS ENUM('active', 'left', 'removed');--> statement-breakpoint
ALTER TYPE "public"."community_notification_kind" ADD VALUE 'discipleship_joined';--> statement-breakpoint
ALTER TYPE "public"."community_notification_kind" ADD VALUE 'discipleship_prompt';--> statement-breakpoint
ALTER TYPE "public"."community_notification_kind" ADD VALUE 'discipleship_response';--> statement-breakpoint
ALTER TYPE "public"."community_notification_kind" ADD VALUE 'discipleship_reply';--> statement-breakpoint
CREATE TABLE "discipleship_groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"leader_enrollment_id" integer NOT NULL,
	"name" text NOT NULL,
	"invite_code" text NOT NULL,
	"leader_shares_phone" boolean DEFAULT false NOT NULL,
	"status" "discipleship_group_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discipleship_memberships" (
	"id" serial PRIMARY KEY NOT NULL,
	"group_id" integer NOT NULL,
	"disciple_enrollment_id" integer NOT NULL,
	"status" "discipleship_membership_status" DEFAULT 'active' NOT NULL,
	"shares_phone" boolean DEFAULT false NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "discipleship_prompt_responses" (
	"id" serial PRIMARY KEY NOT NULL,
	"prompt_id" integer NOT NULL,
	"disciple_enrollment_id" integer NOT NULL,
	"body" text NOT NULL,
	"leader_reply" text,
	"leader_replied_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discipleship_prompts" (
	"id" serial PRIMARY KEY NOT NULL,
	"group_id" integer NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "discipleship_groups" ADD CONSTRAINT "discipleship_groups_leader_enrollment_id_sogp_enrollments_id_fk" FOREIGN KEY ("leader_enrollment_id") REFERENCES "public"."sogp_enrollments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discipleship_memberships" ADD CONSTRAINT "discipleship_memberships_group_id_discipleship_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."discipleship_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discipleship_memberships" ADD CONSTRAINT "discipleship_memberships_disciple_enrollment_id_sogp_enrollments_id_fk" FOREIGN KEY ("disciple_enrollment_id") REFERENCES "public"."sogp_enrollments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discipleship_prompt_responses" ADD CONSTRAINT "discipleship_prompt_responses_prompt_id_discipleship_prompts_id_fk" FOREIGN KEY ("prompt_id") REFERENCES "public"."discipleship_prompts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discipleship_prompt_responses" ADD CONSTRAINT "discipleship_prompt_responses_disciple_enrollment_id_sogp_enrollments_id_fk" FOREIGN KEY ("disciple_enrollment_id") REFERENCES "public"."sogp_enrollments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discipleship_prompts" ADD CONSTRAINT "discipleship_prompts_group_id_discipleship_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."discipleship_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "discipleship_groups_leader_idx" ON "discipleship_groups" USING btree ("leader_enrollment_id");--> statement-breakpoint
CREATE UNIQUE INDEX "discipleship_groups_invite_code_idx" ON "discipleship_groups" USING btree ("invite_code");--> statement-breakpoint
CREATE INDEX "discipleship_groups_status_idx" ON "discipleship_groups" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "discipleship_memberships_active_disciple_idx" ON "discipleship_memberships" USING btree ("disciple_enrollment_id") WHERE "discipleship_memberships"."status" = 'active';--> statement-breakpoint
CREATE INDEX "discipleship_memberships_group_status_idx" ON "discipleship_memberships" USING btree ("group_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "discipleship_prompt_responses_prompt_disciple_idx" ON "discipleship_prompt_responses" USING btree ("prompt_id","disciple_enrollment_id");--> statement-breakpoint
CREATE INDEX "discipleship_prompts_group_created_idx" ON "discipleship_prompts" USING btree ("group_id","created_at");