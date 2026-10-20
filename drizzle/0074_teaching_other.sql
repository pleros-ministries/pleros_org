-- Teaching on My reports can include "Other" besides SOGP and the podcast
-- (Pastor, 20 October): a teaching from elsewhere, named in `other_title`
-- (a Sunday service, a sermon on YouTube). Other can sit beside SOGP or the
-- podcast, so `source` keeps what Pleros recorded and gains 'none' for a day
-- that was Other only, which then needs its title.
ALTER TABLE "daily_teaching_reports" ADD COLUMN IF NOT EXISTS "other_title" text;--> statement-breakpoint
ALTER TABLE "daily_teaching_reports" DROP CONSTRAINT IF EXISTS "daily_teaching_reports_source_check";--> statement-breakpoint
ALTER TABLE "daily_teaching_reports" ADD CONSTRAINT "daily_teaching_reports_source_check" CHECK ("source" in ('sogp', 'podcast', 'both', 'none'));--> statement-breakpoint
ALTER TABLE "daily_teaching_reports" ADD CONSTRAINT "daily_teaching_reports_other_title_check" CHECK ("other_title" is null or char_length("other_title") between 1 and 200);--> statement-breakpoint
ALTER TABLE "daily_teaching_reports" ADD CONSTRAINT "daily_teaching_reports_something_check" CHECK ("source" <> 'none' or "other_title" is not null);
