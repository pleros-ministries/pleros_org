-- Natural assignment (Pastor, 20 October): an optional report under "Other
-- reports" on My reports, never part of the daily report. Each day a person
-- sets goals, each with to-dos and an optional deadline, ticks the to-dos off
-- and writes what happened against each goal at the end of the day.
CREATE TABLE IF NOT EXISTS "natural_assignment_goals" (
  "id" serial PRIMARY KEY,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "report_date" date NOT NULL,
  "title" text NOT NULL,
  "outcome" text,
  "position" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "natural_assignment_goals_title_len" CHECK (char_length("title") BETWEEN 1 AND 200),
  CONSTRAINT "natural_assignment_goals_outcome_len" CHECK ("outcome" IS NULL OR char_length("outcome") <= 1000)
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "natural_assignment_goals_user_date_idx" ON "natural_assignment_goals" ("user_id", "report_date");--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "natural_assignment_todos" (
  "id" serial PRIMARY KEY,
  "goal_id" integer NOT NULL REFERENCES "natural_assignment_goals"("id") ON DELETE CASCADE,
  "text" text NOT NULL,
  "deadline" time,
  "done_at" timestamp with time zone,
  "position" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "natural_assignment_todos_text_len" CHECK (char_length("text") BETWEEN 1 AND 200)
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "natural_assignment_todos_goal_idx" ON "natural_assignment_todos" ("goal_id");
