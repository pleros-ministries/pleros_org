-- How a new enrolment reached its follow-up owner (code, link or geography)
-- and, for a link, the learner's accept/request choice. Additive: existing
-- assignments, enrolments and memberships are untouched; no backfill.
CREATE TABLE "sogp_follow_up_routes" (
  "enrollment_id" integer PRIMARY KEY REFERENCES "sogp_enrollments"("id") ON DELETE CASCADE,
  "source" text NOT NULL,
  "owner_user_id" text REFERENCES "users"("id") ON DELETE SET NULL,
  "choice" text,
  "chosen_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "sogp_follow_up_routes_source_check" CHECK (source IN ('code','link','geography')),
  CONSTRAINT "sogp_follow_up_routes_choice_check" CHECK (choice IS NULL OR choice IN ('accepted','requested'))
);
--> statement-breakpoint
CREATE INDEX "sogp_follow_up_routes_owner_idx" ON "sogp_follow_up_routes" ("owner_user_id");
--> statement-breakpoint
-- In-app invitations to a discipleship group. Membership is created only when
-- the recipient accepts; a pending invitation grants nothing.
CREATE TABLE "discipleship_group_invitations" (
  "id" serial PRIMARY KEY,
  "group_id" integer NOT NULL REFERENCES "discipleship_groups"("id") ON DELETE CASCADE,
  "recipient_enrollment_id" integer NOT NULL REFERENCES "sogp_enrollments"("id") ON DELETE CASCADE,
  "invited_by" text REFERENCES "users"("id") ON DELETE SET NULL,
  "origin" text NOT NULL,
  "status" text NOT NULL DEFAULT 'pending',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "responded_at" timestamptz,
  CONSTRAINT "discipleship_group_invitations_origin_check" CHECK (origin IN ('referral','in_app')),
  CONSTRAINT "discipleship_group_invitations_status_check" CHECK (status IN ('pending','accepted','declined','withdrawn'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX "discipleship_group_invitations_pending_idx" ON "discipleship_group_invitations" ("group_id","recipient_enrollment_id") WHERE status = 'pending';
--> statement-breakpoint
CREATE INDEX "discipleship_group_invitations_recipient_idx" ON "discipleship_group_invitations" ("recipient_enrollment_id","status");
--> statement-breakpoint
CREATE INDEX "discipleship_group_invitations_group_idx" ON "discipleship_group_invitations" ("group_id","status");
