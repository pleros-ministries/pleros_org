-- Explicit replacement offers for a named learner's recorded missed review.
-- Original attendance and legacy certificate/progress records are untouched.
CREATE TABLE "sogp_review_makeups" (
  "id" serial PRIMARY KEY,
  "review_id" integer NOT NULL,
  "enrollment_id" integer NOT NULL,
  "offered_by" text NOT NULL REFERENCES "users"("id"),
  "request_key" text NOT NULL,
  "starts_at" timestamptz NOT NULL,
  "ends_at" timestamptz NOT NULL,
  "venue" text NOT NULL,
  "status" text NOT NULL DEFAULT 'offered',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "chosen_at" timestamptz,
  "confirmed_by" text REFERENCES "users"("id") ON DELETE SET NULL,
  "confirmed_at" timestamptz,
  CONSTRAINT "sogp_review_makeups_original_fk" FOREIGN KEY ("review_id","enrollment_id") REFERENCES "sogp_group_review_attendance"("review_id","enrollment_id") ON DELETE CASCADE,
  CONSTRAINT "sogp_review_makeups_time_check" CHECK (ends_at > starts_at),
  CONSTRAINT "sogp_review_makeups_venue_check" CHECK (length(trim(venue)) BETWEEN 1 AND 300),
  CONSTRAINT "sogp_review_makeups_status_check" CHECK (status IN ('offered','chosen','attended','missed'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX "sogp_review_makeups_request_idx" ON "sogp_review_makeups" ("offered_by","request_key");
--> statement-breakpoint
CREATE UNIQUE INDEX "sogp_review_makeups_one_choice_idx" ON "sogp_review_makeups" ("review_id","enrollment_id") WHERE status IN ('chosen','attended');
--> statement-breakpoint
CREATE INDEX "sogp_review_makeups_original_idx" ON "sogp_review_makeups" ("review_id","enrollment_id","starts_at");
--> statement-breakpoint
CREATE INDEX "sogp_review_makeups_enrollment_idx" ON "sogp_review_makeups" ("enrollment_id");
--> statement-breakpoint
CREATE INDEX "sogp_review_makeups_actor_idx" ON "sogp_review_makeups" ("confirmed_by");
