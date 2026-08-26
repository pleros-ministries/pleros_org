CREATE TYPE "public"."sogp_preparation_resource_type" AS ENUM('teaching', 'podcast', 'video', 'reading', 'gift', 'announcement');--> statement-breakpoint
CREATE TYPE "public"."sogp_preparation_status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TABLE "sogp_preparation_days" (
	"id" serial PRIMARY KEY NOT NULL,
	"cohort_id" integer NOT NULL,
	"publish_date" date NOT NULL,
	"countdown_label" text NOT NULL,
	"introduction" text NOT NULL,
	"status" "sogp_preparation_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sogp_preparation_resources" (
	"id" serial PRIMARY KEY NOT NULL,
	"preparation_day_id" integer NOT NULL,
	"type" "sogp_preparation_resource_type" NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"url" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sogp_cohort_tracks" ALTER COLUMN "day_number" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "sogp_cohort_tracks" ADD COLUMN "curriculum_level" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "sogp_cohort_tracks" ADD COLUMN "curriculum_order" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "sogp_cohort_tracks" ADD COLUMN "is_required" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "sogp_cohort_tracks" ADD COLUMN "live_session_number" integer;--> statement-breakpoint
ALTER TABLE "sogp_enrollments" ADD COLUMN "first_name" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "sogp_enrollments" ADD COLUMN "last_name" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "sogp_enrollments" ADD COLUMN "country_code" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "sogp_enrollments" ADD COLUMN "region" text DEFAULT '' NOT NULL;--> statement-breakpoint
UPDATE "sogp_cohort_tracks" AS track
SET
	"curriculum_level" = lesson."level_id",
	"curriculum_order" = track."day_number"
FROM "lessons" AS lesson
WHERE lesson."id" = track."lesson_id";--> statement-breakpoint
UPDATE "sogp_enrollments"
SET
	"first_name" = split_part(trim("name"), ' ', 1),
	"last_name" = trim(regexp_replace(trim("name"), '^\\S+\\s*', '')),
	"country_code" = CASE WHEN lower(trim("country")) = 'nigeria' THEN 'NG' ELSE '' END,
	"region" = "country";--> statement-breakpoint
ALTER TABLE "sogp_preparation_days" ADD CONSTRAINT "sogp_preparation_days_cohort_id_sogp_cohorts_id_fk" FOREIGN KEY ("cohort_id") REFERENCES "public"."sogp_cohorts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sogp_preparation_resources" ADD CONSTRAINT "sogp_preparation_resources_preparation_day_id_sogp_preparation_days_id_fk" FOREIGN KEY ("preparation_day_id") REFERENCES "public"."sogp_preparation_days"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "sogp_preparation_days_cohort_date_idx" ON "sogp_preparation_days" USING btree ("cohort_id","publish_date");--> statement-breakpoint
CREATE INDEX "sogp_preparation_days_status_date_idx" ON "sogp_preparation_days" USING btree ("status","publish_date");--> statement-breakpoint
CREATE UNIQUE INDEX "sogp_preparation_resources_day_order_idx" ON "sogp_preparation_resources" USING btree ("preparation_day_id","sort_order");--> statement-breakpoint
CREATE INDEX "sogp_preparation_resources_day_idx" ON "sogp_preparation_resources" USING btree ("preparation_day_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sogp_cohort_tracks_cohort_order_idx" ON "sogp_cohort_tracks" USING btree ("cohort_id","curriculum_order");
