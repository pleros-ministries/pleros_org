CREATE TYPE "public"."contact_discipleship_status" AS ENUM('not_started', 'following_up', 'in_discipleship', 'in_sogp', 'in_church', 'lost_contact');--> statement-breakpoint
CREATE TYPE "public"."contact_interaction_kind" AS ENUM('met', 'follow_up', 'call', 'whatsapp', 'visit', 'message', 'other');--> statement-breakpoint
CREATE TYPE "public"."contact_salvation_status" AS ENUM('unknown', 'not_saved', 'saved', 'believer');--> statement-breakpoint
CREATE TYPE "public"."ministry_activity_kind" AS ENUM('outreach', 'teaching_meeting', 'prayer_meeting', 'follow_up', 'church_service', 'other');--> statement-breakpoint
CREATE TYPE "public"."outreach_mode" AS ENUM('online', 'offline', 'both');--> statement-breakpoint
CREATE TABLE "ministry_activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"activity_date" date NOT NULL,
	"kind" "ministry_activity_kind" NOT NULL,
	"title" text,
	"mode" "outreach_mode",
	"platform" text,
	"location" text,
	"reached_online" integer DEFAULT 0 NOT NULL,
	"reached_offline" integer DEFAULT 0 NOT NULL,
	"attendance" integer DEFAULT 0 NOT NULL,
	"saved" integer DEFAULT 0 NOT NULL,
	"not_saved" integer DEFAULT 0 NOT NULL,
	"filled" integer DEFAULT 0 NOT NULL,
	"healed" integer DEFAULT 0 NOT NULL,
	"follow_ups" integer DEFAULT 0 NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "outreach_contact_interactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"contact_id" integer NOT NULL,
	"user_id" text,
	"activity_id" integer,
	"interaction_date" date NOT NULL,
	"kind" "contact_interaction_kind" NOT NULL,
	"saved" boolean DEFAULT false NOT NULL,
	"filled" boolean DEFAULT false NOT NULL,
	"healed" boolean DEFAULT false NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "outreach_contacts" ADD COLUMN "activity_id" integer;--> statement-breakpoint
ALTER TABLE "outreach_contacts" ADD COLUMN "salvation_status" "contact_salvation_status" DEFAULT 'unknown' NOT NULL;--> statement-breakpoint
ALTER TABLE "outreach_contacts" ADD COLUMN "discipleship_status" "contact_discipleship_status" DEFAULT 'not_started' NOT NULL;--> statement-breakpoint
ALTER TABLE "outreach_contacts" ADD COLUMN "follow_up_plan" text;--> statement-breakpoint
ALTER TABLE "outreach_contacts" ADD COLUMN "next_follow_up_date" date;--> statement-breakpoint
ALTER TABLE "ministry_activities" ADD CONSTRAINT "ministry_activities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outreach_contact_interactions" ADD CONSTRAINT "outreach_contact_interactions_contact_id_outreach_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."outreach_contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outreach_contact_interactions" ADD CONSTRAINT "outreach_contact_interactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outreach_contact_interactions" ADD CONSTRAINT "outreach_contact_interactions_activity_id_ministry_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."ministry_activities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ministry_activities_user_date_idx" ON "ministry_activities" USING btree ("user_id","activity_date");--> statement-breakpoint
CREATE INDEX "ministry_activities_date_idx" ON "ministry_activities" USING btree ("activity_date");--> statement-breakpoint
CREATE INDEX "outreach_contact_interactions_contact_date_idx" ON "outreach_contact_interactions" USING btree ("contact_id","interaction_date");--> statement-breakpoint
CREATE INDEX "outreach_contact_interactions_activity_idx" ON "outreach_contact_interactions" USING btree ("activity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "outreach_contact_interactions_activity_contact_idx" ON "outreach_contact_interactions" USING btree ("activity_id","contact_id") WHERE "outreach_contact_interactions"."activity_id" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "outreach_contacts" ADD CONSTRAINT "outreach_contacts_activity_id_ministry_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."ministry_activities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "outreach_contacts_activity_idx" ON "outreach_contacts" USING btree ("activity_id");--> statement-breakpoint
-- Copy every daily report into the activity log as an outreach activity.
-- Guarded so it can be re-run by hand after deploy if old code added rows meanwhile.
INSERT INTO "ministry_activities"
  ("user_id", "activity_date", "kind", "mode", "reached_online", "reached_offline",
   "saved", "not_saved", "filled", "healed", "follow_ups", "note", "created_at", "updated_at")
SELECT r."user_id", r."report_date", 'outreach',
  CASE
    WHEN r."reached_online" > 0 AND r."reached_offline" = 0 THEN 'online'
    WHEN r."reached_offline" > 0 AND r."reached_online" = 0 THEN 'offline'
    ELSE 'both'
  END::"public"."outreach_mode",
  r."reached_online", r."reached_offline", r."saved", r."not_saved", r."filled", r."healed",
  r."follow_ups", r."note", r."created_at", r."updated_at"
FROM "ministry_reports" AS r
WHERE NOT EXISTS (
  SELECT 1 FROM "ministry_activities" AS a
  WHERE a."user_id" = r."user_id" AND a."activity_date" = r."report_date" AND a."kind" = 'outreach'
)
ORDER BY r."id";--> statement-breakpoint
DO $$
DECLARE missing integer;
BEGIN
  SELECT count(*) INTO missing FROM "ministry_reports" AS r
  WHERE NOT EXISTS (
    SELECT 1 FROM "ministry_activities" AS a
    WHERE a."user_id" = r."user_id" AND a."activity_date" = r."report_date" AND a."kind" = 'outreach');
  IF missing <> 0 THEN
    RAISE EXCEPTION 'Ministry activities migration left % reports uncopied', missing;
  END IF;
END $$;--> statement-breakpoint
-- Link each person to the outreach on the day they were met.
UPDATE "outreach_contacts" AS c
SET "activity_id" = a."id"
FROM "ministry_activities" AS a
WHERE a."user_id" = c."user_id"
  AND a."activity_date" = c."met_date"
  AND a."kind" = 'outreach'
  AND c."activity_id" IS NULL;--> statement-breakpoint
-- One "met" entry per existing person, so their history starts where it did.
INSERT INTO "outreach_contact_interactions"
  ("contact_id", "user_id", "activity_id", "interaction_date", "kind", "saved", "filled", "healed", "note", "created_at")
SELECT c."id", c."user_id", c."activity_id", c."met_date", 'met', false, false, false, NULL, c."created_at"
FROM "outreach_contacts" AS c
WHERE NOT EXISTS (
  SELECT 1 FROM "outreach_contact_interactions" AS i WHERE i."contact_id" = c."id" AND i."kind" = 'met'
);--> statement-breakpoint
-- A follow-up entry for everyone already ticked off, on the Lagos day it happened.
INSERT INTO "outreach_contact_interactions"
  ("contact_id", "user_id", "activity_id", "interaction_date", "kind", "saved", "filled", "healed", "note", "created_at")
SELECT c."id", c."followed_up_by", NULL,
  (c."followed_up_at" AT TIME ZONE 'Africa/Lagos')::date, 'follow_up', false, false, false,
  c."follow_up_note", c."followed_up_at"
FROM "outreach_contacts" AS c
WHERE c."followed_up_at" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "outreach_contact_interactions" AS i WHERE i."contact_id" = c."id" AND i."kind" <> 'met'
  );
