-- Choose doctrinal journey (user and Pastor, 24 November): a third learning path.
-- A journey is a plan of Library teachings, one a day, stored in the existing
-- plan, listen and playback tables under "teaching:<id>" keys, so only the
-- path checks on sogp_learning_preferences change. No data is rewritten.
ALTER TABLE "sogp_learning_preferences" DROP CONSTRAINT "sogp_learning_preferences_path_check";--> statement-breakpoint
ALTER TABLE "sogp_learning_preferences" ADD CONSTRAINT "sogp_learning_preferences_path_check" CHECK ("sogp_learning_preferences"."path" in ('traditional','podcast_one','podcast_two','doctrinal'));--> statement-breakpoint
ALTER TABLE "sogp_learning_preferences" DROP CONSTRAINT "sogp_learning_preferences_pace_check";--> statement-breakpoint
ALTER TABLE "sogp_learning_preferences" ADD CONSTRAINT "sogp_learning_preferences_pace_check" CHECK ("sogp_learning_preferences"."episodes_per_day" in (1,2) and ("sogp_learning_preferences"."path" = 'traditional' or ("sogp_learning_preferences"."path" in ('podcast_one','doctrinal') and "sogp_learning_preferences"."episodes_per_day" = 1) or ("sogp_learning_preferences"."path" = 'podcast_two' and "sogp_learning_preferences"."episodes_per_day" = 2)));
