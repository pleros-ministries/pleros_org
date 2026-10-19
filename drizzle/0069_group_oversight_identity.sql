-- Groups as oversight (Pastor, 19 October): key group leaders, members and
-- invitation recipients on users, not SOGP enrolments, so oversight follows
-- the person across cohorts. Additive only: the enrolment columns stay.
-- Triggers fill the user columns from the enrolment, so code written before
-- this migration keeps working and backfill and new rows cannot drift apart.

ALTER TABLE "discipleship_groups" ADD COLUMN IF NOT EXISTS "leader_user_id" text REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "discipleship_memberships" ADD COLUMN IF NOT EXISTS "member_user_id" text REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "discipleship_group_invitations" ADD COLUMN IF NOT EXISTS "recipient_user_id" text REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint

UPDATE "discipleship_groups" g SET "leader_user_id" = e."user_id" FROM "sogp_enrollments" e WHERE e."id" = g."leader_enrollment_id" AND g."leader_user_id" IS DISTINCT FROM e."user_id";--> statement-breakpoint
UPDATE "discipleship_memberships" m SET "member_user_id" = e."user_id" FROM "sogp_enrollments" e WHERE e."id" = m."disciple_enrollment_id" AND m."member_user_id" IS DISTINCT FROM e."user_id";--> statement-breakpoint
UPDATE "discipleship_group_invitations" i SET "recipient_user_id" = e."user_id" FROM "sogp_enrollments" e WHERE e."id" = i."recipient_enrollment_id" AND i."recipient_user_id" IS DISTINCT FROM e."user_id";--> statement-breakpoint

CREATE OR REPLACE FUNCTION "pleros_fill_group_leader_user"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW."leader_enrollment_id" IS NOT NULL THEN
    SELECT "user_id" INTO NEW."leader_user_id" FROM "sogp_enrollments" WHERE "id" = NEW."leader_enrollment_id";
  END IF;
  RETURN NEW;
END $$;--> statement-breakpoint
CREATE OR REPLACE FUNCTION "pleros_fill_membership_user"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW."disciple_enrollment_id" IS NOT NULL THEN
    SELECT "user_id" INTO NEW."member_user_id" FROM "sogp_enrollments" WHERE "id" = NEW."disciple_enrollment_id";
  END IF;
  RETURN NEW;
END $$;--> statement-breakpoint
CREATE OR REPLACE FUNCTION "pleros_fill_invitation_user"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW."recipient_enrollment_id" IS NOT NULL THEN
    SELECT "user_id" INTO NEW."recipient_user_id" FROM "sogp_enrollments" WHERE "id" = NEW."recipient_enrollment_id";
  END IF;
  RETURN NEW;
END $$;--> statement-breakpoint

DROP TRIGGER IF EXISTS "discipleship_groups_fill_leader_user" ON "discipleship_groups";--> statement-breakpoint
CREATE TRIGGER "discipleship_groups_fill_leader_user" BEFORE INSERT OR UPDATE OF "leader_enrollment_id" ON "discipleship_groups" FOR EACH ROW EXECUTE FUNCTION "pleros_fill_group_leader_user"();--> statement-breakpoint
DROP TRIGGER IF EXISTS "discipleship_memberships_fill_member_user" ON "discipleship_memberships";--> statement-breakpoint
CREATE TRIGGER "discipleship_memberships_fill_member_user" BEFORE INSERT OR UPDATE OF "disciple_enrollment_id" ON "discipleship_memberships" FOR EACH ROW EXECUTE FUNCTION "pleros_fill_membership_user"();--> statement-breakpoint
DROP TRIGGER IF EXISTS "discipleship_group_invitations_fill_recipient_user" ON "discipleship_group_invitations";--> statement-breakpoint
CREATE TRIGGER "discipleship_group_invitations_fill_recipient_user" BEFORE INSERT OR UPDATE OF "recipient_enrollment_id" ON "discipleship_group_invitations" FOR EACH ROW EXECUTE FUNCTION "pleros_fill_invitation_user"();--> statement-breakpoint

ALTER TABLE "discipleship_groups" ALTER COLUMN "leader_user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "discipleship_memberships" ALTER COLUMN "member_user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "discipleship_group_invitations" ALTER COLUMN "recipient_user_id" SET NOT NULL;--> statement-breakpoint

-- One overseer per person (user decision, 19 October): one active membership per user.
CREATE UNIQUE INDEX IF NOT EXISTS "discipleship_memberships_active_member_idx" ON "discipleship_memberships" ("member_user_id") WHERE "status" = 'active';--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "discipleship_memberships_member_idx" ON "discipleship_memberships" ("member_user_id", "status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "discipleship_groups_leader_user_idx" ON "discipleship_groups" ("leader_user_id", "status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "discipleship_group_invitations_recipient_user_idx" ON "discipleship_group_invitations" ("recipient_user_id", "status");
