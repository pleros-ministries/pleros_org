CREATE TYPE "public"."sogp_learning_progress_track" AS ENUM('sogp', 'pre_sogp');--> statement-breakpoint
CREATE TABLE "sogp_learning_progress_shares" (
	"id" serial PRIMARY KEY NOT NULL,
	"enrollment_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"track" "sogp_learning_progress_track" NOT NULL,
	"day_number" integer,
	"quote" text NOT NULL,
	"author_name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sogp_learning_progress_shares" ADD CONSTRAINT "sogp_learning_progress_shares_enrollment_id_sogp_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."sogp_enrollments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sogp_learning_progress_shares" ADD CONSTRAINT "sogp_learning_progress_shares_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sogp_learning_progress_shares_user_idx" ON "sogp_learning_progress_shares" USING btree ("user_id");