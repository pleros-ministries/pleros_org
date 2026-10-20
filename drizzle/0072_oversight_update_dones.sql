-- Oversight's Updates tab (Pastor, 20 October): "Needs you" becomes a list
-- each overseer works through and ticks off. An update is computed live
-- (no report in 3 days, questions waiting, at risk, joined a group); this table
-- only remembers which ones this viewer has marked Done. The key names the
-- update and the day it started, so a person who goes quiet again later shows
-- up as a new update.
CREATE TABLE IF NOT EXISTS "oversight_update_dones" (
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "update_key" text NOT NULL,
  "done_at" timestamp with time zone DEFAULT now() NOT NULL,
  PRIMARY KEY ("user_id", "update_key")
);
