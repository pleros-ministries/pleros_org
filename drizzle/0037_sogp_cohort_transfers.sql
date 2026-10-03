CREATE TYPE "public"."sogp_cohort_transfer_status" AS ENUM('asked', 'declined', 'moved');--> statement-breakpoint
CREATE TABLE "sogp_cohort_transfers" (
	"id" serial PRIMARY KEY NOT NULL,
	"enrollment_id" integer NOT NULL,
	"from_cohort_id" integer NOT NULL,
	"to_cohort_id" integer NOT NULL,
	"status" "sogp_cohort_transfer_status" DEFAULT 'asked' NOT NULL,
	"asked_by" text,
	"asked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_by" text,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "sogp_cohort_transfers" ADD CONSTRAINT "sogp_cohort_transfers_enrollment_id_sogp_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."sogp_enrollments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sogp_cohort_transfers" ADD CONSTRAINT "sogp_cohort_transfers_from_cohort_id_sogp_cohorts_id_fk" FOREIGN KEY ("from_cohort_id") REFERENCES "public"."sogp_cohorts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sogp_cohort_transfers" ADD CONSTRAINT "sogp_cohort_transfers_to_cohort_id_sogp_cohorts_id_fk" FOREIGN KEY ("to_cohort_id") REFERENCES "public"."sogp_cohorts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sogp_cohort_transfers" ADD CONSTRAINT "sogp_cohort_transfers_asked_by_users_id_fk" FOREIGN KEY ("asked_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sogp_cohort_transfers" ADD CONSTRAINT "sogp_cohort_transfers_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "sogp_cohort_transfers_enrollment_target_idx" ON "sogp_cohort_transfers" USING btree ("enrollment_id","to_cohort_id");--> statement-breakpoint
CREATE INDEX "sogp_cohort_transfers_target_idx" ON "sogp_cohort_transfers" USING btree ("to_cohort_id");