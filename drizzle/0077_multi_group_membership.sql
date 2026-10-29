-- Multi-group membership (user, 29 October): a person may be active in several
-- groups (up to five, checked in the app), and every one of those leaders
-- oversees them. The one-membership-per-person indexes go; one active
-- membership per person per group stays. No data changes.
DROP INDEX IF EXISTS "discipleship_memberships_active_member_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "discipleship_memberships_active_disciple_idx";--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "discipleship_memberships_active_group_member_idx" ON "discipleship_memberships" ("group_id", "member_user_id") WHERE "status" = 'active';
