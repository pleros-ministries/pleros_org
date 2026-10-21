-- My reports after the Pastor's 21 October review.
-- 1. Evangelism, Discipleship and Meetings are answered Yes or No every day,
--    and No needs a reason: `daily_report_no_reasons`, one per person, day
--    and part. (Both ministry parts No also records the existing Ministry
--    "nil" declaration, so report statuses are unchanged.)
-- 2. Meetings are each person's own report again: a teaching or prayer
--    meeting they led (start and end time, workers and members present) or
--    attended (people brought). The activity row keeps the canonical
--    numbers: `title` is the teaching emphasis, `location` the venue,
--    `attendance` workers plus members. An outreach meeting is a new kind,
--    drawn from the day's evangelism and discipleship, with no details row.
ALTER TYPE "public"."ministry_activity_kind" ADD VALUE IF NOT EXISTS 'outreach_meeting';--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "daily_report_no_reasons" (
	"user_id" text NOT NULL REFERENCES "users"("id") ON DELETE cascade,
	"report_date" date NOT NULL,
	"part" text NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "daily_report_no_reasons_pk" PRIMARY KEY ("user_id", "report_date", "part"),
	CONSTRAINT "daily_report_no_reasons_part_check" CHECK ("part" in ('evangelism', 'discipleship', 'meetings')),
	CONSTRAINT "daily_report_no_reasons_reason_check" CHECK (char_length(trim("reason")) between 3 and 300)
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "daily_report_no_reasons_date_idx" ON "daily_report_no_reasons" ("report_date", "user_id");--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "meeting_report_details" (
	"activity_id" integer PRIMARY KEY REFERENCES "ministry_activities"("id") ON DELETE cascade,
	"role" text NOT NULL,
	"starts_at" time,
	"ends_at" time,
	"workers" integer,
	"members" integer,
	"people_brought" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "meeting_report_details_role_check" CHECK ("role" in ('led', 'attended')),
	CONSTRAINT "meeting_report_details_shape_check" CHECK (
		("role" = 'led' and "starts_at" is not null and "ends_at" is not null and "starts_at" <> "ends_at"
			and "workers" between 0 and 100000 and "members" between 0 and 100000 and "workers" + "members" > 0 and "people_brought" = 0)
		or ("role" = 'attended' and "starts_at" is null and "ends_at" is null and "workers" is null and "members" is null)
	),
	CONSTRAINT "meeting_report_details_brought_check" CHECK ("people_brought" between 0 and 50)
);
