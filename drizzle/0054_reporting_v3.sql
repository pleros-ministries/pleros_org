CREATE TABLE "church_meeting_reports" (
	"meeting_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"activity_id" integer NOT NULL,
	"participation" text NOT NULL,
	"attended" boolean NOT NULL,
	"people_brought" integer NOT NULL,
	CONSTRAINT "church_meeting_reports_meeting_id_user_id_pk" PRIMARY KEY("meeting_id","user_id"),
	CONSTRAINT "church_meeting_reports_participation_check" CHECK ("church_meeting_reports"."participation" in ('leader', 'worker', 'disciple')),
	CONSTRAINT "church_meeting_reports_brought_check" CHECK ("church_meeting_reports"."people_brought" between 0 and 50)
);
--> statement-breakpoint
CREATE TABLE "church_shared_meetings" (
	"id" serial PRIMARY KEY NOT NULL,
	"unit_id" integer NOT NULL,
	"creator_user_id" text NOT NULL,
	"request_key" text NOT NULL,
	"kind" text NOT NULL,
	"meeting_date" date NOT NULL,
	"subject" text,
	"venue" text,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"total_attendance" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "church_shared_meetings_shape_check" CHECK (("church_shared_meetings"."kind" = 'teaching_meeting' and length(trim("church_shared_meetings"."subject")) between 1 and 500 and "church_shared_meetings"."subject" is not null and "church_shared_meetings"."venue" is null and "church_shared_meetings"."starts_at" is null and "church_shared_meetings"."ends_at" is null) or ("church_shared_meetings"."kind" = 'prayer_meeting' and "church_shared_meetings"."subject" is null and length(trim("church_shared_meetings"."venue")) between 1 and 120 and "church_shared_meetings"."venue" is not null and "church_shared_meetings"."starts_at" is not null and "church_shared_meetings"."ends_at" > "church_shared_meetings"."starts_at" and "church_shared_meetings"."ends_at" is not null)),
	CONSTRAINT "church_shared_meetings_total_check" CHECK ("church_shared_meetings"."total_attendance" between 0 and 100000)
);
--> statement-breakpoint
CREATE TABLE "ministry_report_contacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"activity_id" integer NOT NULL,
	"private_contact_id" integer,
	"legacy_contact_id" integer,
	CONSTRAINT "ministry_report_contacts_one_source_check" CHECK (("ministry_report_contacts"."private_contact_id" is not null and "ministry_report_contacts"."legacy_contact_id" is null) or ("ministry_report_contacts"."private_contact_id" is null and "ministry_report_contacts"."legacy_contact_id" is not null))
);
--> statement-breakpoint
CREATE TABLE "ministry_report_entries" (
	"activity_id" integer PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"request_key" text NOT NULL,
	"method" text NOT NULL,
	"context" text,
	"entered_outcomes" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "private_ministry_contacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"request_key" text NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "private_ministry_contacts_required_check" CHECK (length(trim("private_ministry_contacts"."name")) between 2 and 80 and length(trim("private_ministry_contacts"."phone")) between 7 and 30)
);
--> statement-breakpoint
ALTER TABLE "church_meeting_reports" ADD CONSTRAINT "church_meeting_reports_meeting_id_church_shared_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."church_shared_meetings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "church_meeting_reports" ADD CONSTRAINT "church_meeting_reports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "church_meeting_reports" ADD CONSTRAINT "church_meeting_reports_activity_id_ministry_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."ministry_activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "church_shared_meetings" ADD CONSTRAINT "church_shared_meetings_unit_id_church_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."church_units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "church_shared_meetings" ADD CONSTRAINT "church_shared_meetings_creator_user_id_users_id_fk" FOREIGN KEY ("creator_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ministry_report_contacts" ADD CONSTRAINT "ministry_report_contacts_activity_id_ministry_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."ministry_activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ministry_report_contacts" ADD CONSTRAINT "ministry_report_contacts_private_contact_id_private_ministry_contacts_id_fk" FOREIGN KEY ("private_contact_id") REFERENCES "public"."private_ministry_contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ministry_report_contacts" ADD CONSTRAINT "ministry_report_contacts_legacy_contact_id_outreach_contacts_id_fk" FOREIGN KEY ("legacy_contact_id") REFERENCES "public"."outreach_contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ministry_report_entries" ADD CONSTRAINT "ministry_report_entries_activity_id_ministry_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."ministry_activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ministry_report_entries" ADD CONSTRAINT "ministry_report_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "private_ministry_contacts" ADD CONSTRAINT "private_ministry_contacts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "church_meeting_reports_activity_idx" ON "church_meeting_reports" USING btree ("activity_id");--> statement-breakpoint
CREATE INDEX "church_meeting_reports_user_idx" ON "church_meeting_reports" USING btree ("user_id","meeting_id");--> statement-breakpoint
CREATE UNIQUE INDEX "church_shared_meetings_request_idx" ON "church_shared_meetings" USING btree ("creator_user_id","request_key");--> statement-breakpoint
CREATE INDEX "church_shared_meetings_unit_date_idx" ON "church_shared_meetings" USING btree ("unit_id","meeting_date");--> statement-breakpoint
CREATE UNIQUE INDEX "ministry_report_contacts_private_idx" ON "ministry_report_contacts" USING btree ("activity_id","private_contact_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ministry_report_contacts_legacy_idx" ON "ministry_report_contacts" USING btree ("activity_id","legacy_contact_id");--> statement-breakpoint
CREATE INDEX "ministry_report_contacts_private_contact_idx" ON "ministry_report_contacts" USING btree ("private_contact_id");--> statement-breakpoint
CREATE INDEX "ministry_report_contacts_legacy_contact_idx" ON "ministry_report_contacts" USING btree ("legacy_contact_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ministry_report_entries_request_idx" ON "ministry_report_entries" USING btree ("user_id","request_key");--> statement-breakpoint
CREATE UNIQUE INDEX "private_ministry_contacts_request_idx" ON "private_ministry_contacts" USING btree ("user_id","request_key");--> statement-breakpoint
CREATE INDEX "private_ministry_contacts_owner_idx" ON "private_ministry_contacts" USING btree ("user_id","id");
