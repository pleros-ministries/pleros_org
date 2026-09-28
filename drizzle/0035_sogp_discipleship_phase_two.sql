CREATE TYPE "public"."discipleship_contact_kind" AS ENUM('nudge', 'whatsapp', 'call', 'visit', 'message', 'note');--> statement-breakpoint
CREATE TYPE "public"."discipleship_prayer_status" AS ENUM('open', 'answered');--> statement-breakpoint
ALTER TYPE "public"."community_notification_kind" ADD VALUE 'discipleship_nudge';--> statement-breakpoint
ALTER TYPE "public"."community_notification_kind" ADD VALUE 'discipleship_alert';--> statement-breakpoint
ALTER TYPE "public"."community_notification_kind" ADD VALUE 'discipleship_digest';--> statement-breakpoint
ALTER TYPE "public"."community_notification_kind" ADD VALUE 'discipleship_prayer_request';--> statement-breakpoint
ALTER TYPE "public"."community_notification_kind" ADD VALUE 'discipleship_prayed';--> statement-breakpoint
ALTER TYPE "public"."community_notification_kind" ADD VALUE 'discipleship_prayer_answered';--> statement-breakpoint
CREATE TABLE "discipleship_contact_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"membership_id" integer NOT NULL,
	"kind" "discipleship_contact_kind" NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discipleship_prayer_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"group_id" integer NOT NULL,
	"disciple_enrollment_id" integer NOT NULL,
	"body" text NOT NULL,
	"status" "discipleship_prayer_status" DEFAULT 'open' NOT NULL,
	"answer_note" text,
	"prayed_at" timestamp with time zone,
	"answered_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "discipleship_memberships" ADD COLUMN "last_contacted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "discipleship_memberships" ADD COLUMN "contact_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "discipleship_memberships" ADD COLUMN "last_known_status" text;--> statement-breakpoint
ALTER TABLE "discipleship_contact_logs" ADD CONSTRAINT "discipleship_contact_logs_membership_id_discipleship_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."discipleship_memberships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discipleship_prayer_requests" ADD CONSTRAINT "discipleship_prayer_requests_group_id_discipleship_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."discipleship_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discipleship_prayer_requests" ADD CONSTRAINT "discipleship_prayer_requests_disciple_enrollment_id_sogp_enrollments_id_fk" FOREIGN KEY ("disciple_enrollment_id") REFERENCES "public"."sogp_enrollments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "discipleship_contact_logs_membership_created_idx" ON "discipleship_contact_logs" USING btree ("membership_id","created_at");--> statement-breakpoint
CREATE INDEX "discipleship_prayer_requests_group_created_idx" ON "discipleship_prayer_requests" USING btree ("group_id","created_at");