CREATE TYPE "public"."sogp_fullness_membership" AS ENUM('fullness', 'non_fullness');--> statement-breakpoint
ALTER TABLE "sogp_enrollments" ADD COLUMN "fullness_membership" "sogp_fullness_membership";