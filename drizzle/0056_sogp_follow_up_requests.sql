-- Additive request history only. No assignment, enrolment, progress or
-- discipleship membership is rewritten or populated by this migration.
CREATE TABLE "sogp_follow_up_requests" (
  "id" serial PRIMARY KEY,
  "enrollment_id" integer NOT NULL REFERENCES "sogp_enrollments"("id") ON DELETE CASCADE,
  "previous_follow_up_user_id" text REFERENCES "users"("id") ON DELETE SET NULL,
  "reason" text NOT NULL,
  "status" text NOT NULL DEFAULT 'pending',
  "reviewed_by" text REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "reviewed_at" timestamptz,
  CONSTRAINT "sogp_follow_up_requests_reason_check" CHECK (length(trim(reason)) BETWEEN 1 AND 2000),
  CONSTRAINT "sogp_follow_up_requests_status_check" CHECK (status IN ('pending','resolved','declined'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX "sogp_follow_up_requests_one_pending_idx" ON "sogp_follow_up_requests" ("enrollment_id") WHERE status = 'pending';
--> statement-breakpoint
CREATE INDEX "sogp_follow_up_requests_history_idx" ON "sogp_follow_up_requests" ("enrollment_id", "created_at");
--> statement-breakpoint
CREATE INDEX "sogp_follow_up_requests_previous_owner_idx" ON "sogp_follow_up_requests" ("previous_follow_up_user_id");
--> statement-breakpoint
CREATE INDEX "sogp_follow_up_requests_reviewer_idx" ON "sogp_follow_up_requests" ("reviewed_by");
--> statement-breakpoint
CREATE INDEX "sogp_follow_up_requests_queue_idx" ON "sogp_follow_up_requests" ("created_at") WHERE status = 'pending';
