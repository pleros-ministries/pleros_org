-- "Another time" with the time you actually prayed (user request, 20 October:
-- for people who miss Prayer Watch). Several times a day are allowed. Each day
-- with a time also keeps its `unspecified` row in prayer_watch_attendance, so
-- every report, streak and percentage that counts attendance stays unchanged.
CREATE TABLE IF NOT EXISTS "prayer_watch_other_times" (
  "id" serial PRIMARY KEY,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "prayed_date" date NOT NULL,
  "prayed_at" time NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "prayer_watch_other_times_user_date_time_idx" ON "prayer_watch_other_times" ("user_id", "prayed_date", "prayed_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "prayer_watch_other_times_user_date_idx" ON "prayer_watch_other_times" ("user_id", "prayed_date");
