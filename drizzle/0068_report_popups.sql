CREATE TABLE "bible_reading_plans" (
	"user_id" text PRIMARY KEY NOT NULL,
	"chapters_per_day" integer NOT NULL,
	"start_book" text NOT NULL,
	"start_chapter" integer NOT NULL,
	"started_on" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bible_reading_plans_chapters_check" CHECK ("bible_reading_plans"."chapters_per_day" between 1 and 50),
	CONSTRAINT "bible_reading_plans_start_chapter_check" CHECK ("bible_reading_plans"."start_chapter" >= 1)
);--> statement-breakpoint
ALTER TABLE "bible_reading_plans" ADD CONSTRAINT "bible_reading_plans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE TABLE "daily_teaching_reports" (
	"user_id" text NOT NULL,
	"report_date" date NOT NULL,
	"source" text NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "daily_teaching_reports_user_id_report_date_pk" PRIMARY KEY("user_id","report_date"),
	CONSTRAINT "daily_teaching_reports_source_check" CHECK ("daily_teaching_reports"."source" in ('sogp', 'podcast', 'both')),
	CONSTRAINT "daily_teaching_reports_note_check" CHECK ("daily_teaching_reports"."note" is null or length("daily_teaching_reports"."note") <= 500)
);--> statement-breakpoint
ALTER TABLE "daily_teaching_reports" ADD CONSTRAINT "daily_teaching_reports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE TABLE "ministry_report_details" (
	"activity_id" integer PRIMARY KEY NOT NULL,
	"style" text,
	"actions" text[] DEFAULT '{}' NOT NULL,
	"contact_outcomes" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "ministry_report_details_style_check" CHECK ("ministry_report_details"."style" is null or "ministry_report_details"."style" in ('broadcast', 'direct'))
);--> statement-breakpoint
ALTER TABLE "ministry_report_details" ADD CONSTRAINT "ministry_report_details_activity_id_ministry_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."ministry_activities"("id") ON DELETE cascade ON UPDATE no action;
