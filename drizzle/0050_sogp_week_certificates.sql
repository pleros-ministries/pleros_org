ALTER TYPE "public"."community_notification_kind" ADD VALUE 'sogp_week_certificate';--> statement-breakpoint
CREATE TABLE "sogp_week_certificates" (
	"id" serial PRIMARY KEY NOT NULL,
	"enrollment_id" integer NOT NULL,
	"cohort_id" integer NOT NULL,
	"week" integer NOT NULL,
	"verification_code" text NOT NULL,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "sogp_week_certificates" ADD CONSTRAINT "sogp_week_certificates_enrollment_id_sogp_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."sogp_enrollments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sogp_week_certificates" ADD CONSTRAINT "sogp_week_certificates_cohort_id_sogp_cohorts_id_fk" FOREIGN KEY ("cohort_id") REFERENCES "public"."sogp_cohorts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "sogp_week_certificates_enrollment_cohort_week_idx" ON "sogp_week_certificates" USING btree ("enrollment_id","cohort_id","week");--> statement-breakpoint
CREATE UNIQUE INDEX "sogp_week_certificates_verification_idx" ON "sogp_week_certificates" USING btree ("verification_code");--> statement-breakpoint
CREATE INDEX "sogp_week_certificates_cohort_idx" ON "sogp_week_certificates" USING btree ("cohort_id");