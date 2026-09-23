ALTER TABLE "sogp_enrollments" DROP COLUMN "leaderboard_opt_out";--> statement-breakpoint
ALTER TABLE "sogp_enrollments" ADD COLUMN "leaderboard_alias" text;--> statement-breakpoint
CREATE UNIQUE INDEX "sogp_enrollments_cohort_leaderboard_alias_idx" ON "sogp_enrollments" USING btree ("cohort_id","leaderboard_alias") WHERE "sogp_enrollments"."leaderboard_alias" IS NOT NULL;
