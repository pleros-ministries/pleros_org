-- Group reviews are distinct from legacy cohort live classes. No backfill or
-- certificate formula, automatic missed mark or membership change is made.
CREATE TABLE "sogp_group_reviews" (
  "id" serial PRIMARY KEY,
  "group_id" integer NOT NULL REFERENCES "discipleship_groups"("id") ON DELETE CASCADE,
  "scheduled_by" text NOT NULL REFERENCES "users"("id"),
  "request_key" text NOT NULL,
  "title" text NOT NULL,
  "venue" text NOT NULL,
  "starts_at" timestamptz NOT NULL,
  "ends_at" timestamptz NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "sogp_group_reviews_time_check" CHECK (ends_at > starts_at),
  CONSTRAINT "sogp_group_reviews_title_check" CHECK (length(trim(title)) BETWEEN 1 AND 160),
  CONSTRAINT "sogp_group_reviews_venue_check" CHECK (length(trim(venue)) BETWEEN 1 AND 300)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "sogp_group_reviews_request_idx" ON "sogp_group_reviews" ("scheduled_by", "request_key");
--> statement-breakpoint
CREATE INDEX "sogp_group_reviews_group_time_idx" ON "sogp_group_reviews" ("group_id", "starts_at");
--> statement-breakpoint
CREATE TABLE "sogp_group_review_attendance" (
  "review_id" integer NOT NULL REFERENCES "sogp_group_reviews"("id") ON DELETE CASCADE,
  "enrollment_id" integer NOT NULL REFERENCES "sogp_enrollments"("id") ON DELETE CASCADE,
  "status" text NOT NULL,
  "confirmed_by" text REFERENCES "users"("id") ON DELETE SET NULL,
  "confirmed_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("review_id", "enrollment_id"),
  CONSTRAINT "sogp_group_review_attendance_status_check" CHECK (status IN ('attended','missed'))
);
--> statement-breakpoint
CREATE INDEX "sogp_group_review_attendance_enrollment_idx" ON "sogp_group_review_attendance" ("enrollment_id", "review_id");
--> statement-breakpoint
CREATE INDEX "sogp_group_review_attendance_actor_idx" ON "sogp_group_review_attendance" ("confirmed_by");
