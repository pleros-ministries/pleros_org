-- The next phase after SOGP (Pastor, 21 October). Someone who has finished
-- SOGP chooses what they learn next, and it becomes their current learning.
-- 1. `next_learning`: one row per person. `podcast` means their podcast
--    journey (Foundations, a Library series or their own) is the current
--    learning; `lesson` is one teaching with notes and a quiz, such as the
--    PPC teaching SOGP leaves out. Progress stays in the existing tables.
-- 2. `podcast_journey_episodes`: the episodes a person picked for their own
--    journey (track `own`), one a day in this order.
CREATE TABLE IF NOT EXISTS "next_learning" (
	"user_id" text PRIMARY KEY REFERENCES "users"("id") ON DELETE cascade,
	"kind" text NOT NULL,
	"lesson_id" integer REFERENCES "lessons"("id") ON DELETE cascade,
	"chosen_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "next_learning_kind_check" CHECK ("kind" in ('podcast', 'lesson')),
	CONSTRAINT "next_learning_lesson_check" CHECK (("kind" = 'lesson') = ("lesson_id" IS NOT NULL))
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "podcast_journey_episodes" (
	"user_id" text NOT NULL REFERENCES "users"("id") ON DELETE cascade,
	"position" integer NOT NULL,
	"episode_guid" text NOT NULL,
	CONSTRAINT "podcast_journey_episodes_pk" PRIMARY KEY ("user_id", "position"),
	CONSTRAINT "podcast_journey_episodes_position_check" CHECK ("position" >= 0 AND "position" < 120)
);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "podcast_journey_episodes_unique" ON "podcast_journey_episodes" ("user_id", "episode_guid");
