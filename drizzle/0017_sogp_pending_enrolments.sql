CREATE TYPE "public"."sogp_setup_otp_purpose" AS ENUM('email_verification', 'sign_in');--> statement-breakpoint
CREATE TABLE "sogp_pending_enrollments" (
	"id" serial PRIMARY KEY NOT NULL,
	"flow_token_hash" text NOT NULL,
	"cohort_id" integer NOT NULL,
	"email" text NOT NULL,
	"payload" jsonb NOT NULL,
	"auth_user_id" text,
	"otp_purpose" "sogp_setup_otp_purpose" NOT NULL,
	"code_sent_at" timestamp with time zone,
	"code_send_count" integer DEFAULT 0 NOT NULL,
	"verified_at" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sogp_pending_enrollments" ADD CONSTRAINT "sogp_pending_enrollments_cohort_id_sogp_cohorts_id_fk" FOREIGN KEY ("cohort_id") REFERENCES "public"."sogp_cohorts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "sogp_pending_enrollments_token_idx" ON "sogp_pending_enrollments" USING btree ("flow_token_hash");--> statement-breakpoint
CREATE INDEX "sogp_pending_enrollments_email_idx" ON "sogp_pending_enrollments" USING btree ("email");--> statement-breakpoint
CREATE INDEX "sogp_pending_enrollments_expires_idx" ON "sogp_pending_enrollments" USING btree ("expires_at");
