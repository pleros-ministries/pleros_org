-- Attendance corrections keep the first confirmation: a lead may correct a
-- confirmed mark within 7 days and the original stays visible. Additive and
-- nullable: existing attendance rows are untouched; no backfill.
ALTER TABLE "sogp_group_review_attendance" ADD COLUMN "original_status" text;
--> statement-breakpoint
ALTER TABLE "sogp_group_review_attendance" ADD COLUMN "original_confirmed_at" timestamptz;
--> statement-breakpoint
ALTER TABLE "sogp_group_review_attendance" ADD CONSTRAINT "sogp_group_review_attendance_original_status_check" CHECK ("original_status" is null or "original_status" in ('attended','missed'));
