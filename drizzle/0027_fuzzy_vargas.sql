CREATE TYPE "public"."sogp_orientation_reason" AS ENUM('faith_answers', 'gods_purpose', 'spiritual_growth_freedom', 'divine_healing', 'ministry_supernatural_empowerment', 'wisdom_career_business_finance', 'stronger_walk_fulfilling_purpose');--> statement-breakpoint
CREATE TABLE "sogp_orientation_surveys" (
	"id" serial PRIMARY KEY NOT NULL,
	"enrollment_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"reasons" jsonb NOT NULL,
	"question" text,
	"admin_response" text,
	"responded_by" text,
	"responded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sogp_orientation_surveys" ADD CONSTRAINT "sogp_orientation_surveys_enrollment_id_sogp_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."sogp_enrollments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sogp_orientation_surveys" ADD CONSTRAINT "sogp_orientation_surveys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sogp_orientation_surveys" ADD CONSTRAINT "sogp_orientation_surveys_responded_by_users_id_fk" FOREIGN KEY ("responded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "sogp_orientation_surveys_enrollment_idx" ON "sogp_orientation_surveys" USING btree ("enrollment_id");--> statement-breakpoint
CREATE INDEX "sogp_orientation_surveys_user_idx" ON "sogp_orientation_surveys" USING btree ("user_id");