-- A learner's question on a podcast episode, routed to their active discipler
-- with the episode attached; the Ask Pleros fallback carries episode context.
-- Additive: no existing table is altered except two enum values and two
-- nullable episode columns; no backfill.
ALTER TYPE "community_notification_kind" ADD VALUE 'discipleship_question';
--> statement-breakpoint
ALTER TYPE "community_notification_kind" ADD VALUE 'discipleship_question_reply';
--> statement-breakpoint
CREATE TABLE "discipleship_episode_questions" (
  "id" serial PRIMARY KEY,
  "asker_enrollment_id" integer NOT NULL REFERENCES "sogp_enrollments"("id") ON DELETE CASCADE,
  "group_id" integer NOT NULL REFERENCES "discipleship_groups"("id") ON DELETE CASCADE,
  "discipler_enrollment_id" integer NOT NULL REFERENCES "sogp_enrollments"("id") ON DELETE CASCADE,
  "episode_guid" text NOT NULL,
  "episode_title" text NOT NULL,
  "body" text NOT NULL,
  "reply" text,
  "replied_at" timestamptz,
  "asker_unread" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "discipleship_episode_questions_body_check" CHECK (length(trim("body")) between 1 and 2000)
);
--> statement-breakpoint
CREATE INDEX "discipleship_episode_questions_group_created_idx" ON "discipleship_episode_questions" ("group_id","created_at");
--> statement-breakpoint
CREATE INDEX "discipleship_episode_questions_asker_idx" ON "discipleship_episode_questions" ("asker_enrollment_id","created_at");
--> statement-breakpoint
ALTER TABLE "pleros_questions" ADD COLUMN "episode_guid" text;
--> statement-breakpoint
ALTER TABLE "pleros_questions" ADD COLUMN "episode_title" text;
