ALTER TYPE "public"."discipleship_group_status" ADD VALUE 'closed';--> statement-breakpoint
DROP INDEX "discipleship_groups_leader_idx";--> statement-breakpoint
CREATE INDEX "discipleship_groups_leader_status_idx" ON "discipleship_groups" USING btree ("leader_enrollment_id","status");