-- Monthly leaderboard (Pastor, 25 November 2026): one board for everyone, so
-- how a person appears on it belongs to the person, not to a cohort enrolment.
-- `hidden` takes them off the board (they still see their own rank); `alias`
-- is shown instead of their first name. Everyone is on the board by default.
CREATE TABLE "leaderboard_profiles" (
	"user_id" text PRIMARY KEY NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
	"hidden" boolean DEFAULT false NOT NULL,
	"alias" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "leaderboard_profiles_alias_length" CHECK ("alias" IS NULL OR char_length("alias") BETWEEN 2 AND 24)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "leaderboard_profiles_alias_idx" ON "leaderboard_profiles" (lower("alias")) WHERE "alias" IS NOT NULL;
--> statement-breakpoint
-- Keep the names people already chose on the cohort board: each person's most
-- recently updated enrolment alias. A name someone else already holds is skipped.
INSERT INTO "leaderboard_profiles" ("user_id", "alias", "updated_at")
SELECT DISTINCT ON ("user_id") "user_id", "leaderboard_alias", "updated_at"
FROM "sogp_enrollments"
WHERE "leaderboard_alias" IS NOT NULL AND char_length("leaderboard_alias") BETWEEN 2 AND 24
ORDER BY "user_id", "updated_at" DESC
ON CONFLICT DO NOTHING;
-- sogp_enrollments.leaderboard_alias and podcast_journeys.leaderboard_visible
-- stay until this change is live (the site runs the previous code until then);
-- a later migration drops them.
