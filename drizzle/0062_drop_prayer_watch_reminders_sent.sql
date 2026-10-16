-- Retire the unscheduled legacy prayer-watch-reminder cron's dedup table.
-- The dispatcher owns all Prayer Watch sends with notification_checkpoints.
-- Destructive: the table is empty (verified 2026-10-16) and no code reads it.
DROP TABLE IF EXISTS "prayer_watch_reminders_sent";
