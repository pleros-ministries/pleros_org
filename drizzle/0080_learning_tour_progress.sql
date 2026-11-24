-- Guided tour for new learners (user, 24 November): one row per person, so the
-- tour resumes on any device and never shows again once finished or skipped.
CREATE TABLE "learning_tour_progress" (
	"user_id" text PRIMARY KEY NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"step" text,
	"path" text,
	"plan_mode" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	CONSTRAINT "learning_tour_progress_status_check" CHECK ("learning_tour_progress"."status" in ('active','done','skipped')),
	CONSTRAINT "learning_tour_progress_path_check" CHECK ("learning_tour_progress"."path" is null or "learning_tour_progress"."path" in ('sogp','podcast','doctrinal')),
	CONSTRAINT "learning_tour_progress_mode_check" CHECK ("learning_tour_progress"."plan_mode" is null or "learning_tour_progress"."plan_mode" in ('suggested','own')),
	CONSTRAINT "learning_tour_progress_step_check" CHECK ("learning_tour_progress"."step" is null or length("learning_tour_progress"."step") between 1 and 40)
);--> statement-breakpoint
ALTER TABLE "learning_tour_progress" ADD CONSTRAINT "learning_tour_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
