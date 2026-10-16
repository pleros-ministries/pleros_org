ALTER TABLE "discipleship_groups" ADD COLUMN "is_default" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "pastor_assignments" ADD COLUMN "discipleship_group_id" integer;--> statement-breakpoint
ALTER TABLE "pastor_assignments" ADD CONSTRAINT "pastor_assignments_discipleship_group_id_discipleship_groups_id_fk" FOREIGN KEY ("discipleship_group_id") REFERENCES "public"."discipleship_groups"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pastor_assignments_group_idx" ON "pastor_assignments" USING btree ("discipleship_group_id");--> statement-breakpoint

WITH named_defaults AS (
  SELECT DISTINCT ON ("leader_enrollment_id") "id"
  FROM "discipleship_groups"
  WHERE lower(trim("name")) = lower('SOGP Discipleship Group')
    AND "status" <> 'closed'
  ORDER BY "leader_enrollment_id", "created_at", "id"
)
UPDATE "discipleship_groups"
SET "is_default" = true, "name" = 'SOGP Discipleship Group'
WHERE "id" IN (SELECT "id" FROM named_defaults);--> statement-breakpoint

DO $$
DECLARE
  enrollee record;
  candidate text;
  attempt integer;
BEGIN
  FOR enrollee IN
    SELECT e."id" FROM "sogp_enrollments" e
    WHERE NOT EXISTS (
      SELECT 1 FROM "discipleship_groups" g
      WHERE g."leader_enrollment_id" = e."id" AND g."is_default" = true
    )
  LOOP
    attempt := 0;
    LOOP
      candidate := substr(md5('sogp-default:' || enrollee."id"::text || ':' || attempt::text), 1, 8);
      EXIT WHEN NOT EXISTS (SELECT 1 FROM "discipleship_groups" WHERE "invite_code" = candidate);
      attempt := attempt + 1;
      IF attempt > 100 THEN RAISE EXCEPTION 'Could not allocate SOGP group invite code'; END IF;
    END LOOP;
    INSERT INTO "discipleship_groups" ("leader_enrollment_id", "name", "invite_code", "is_default")
    VALUES (enrollee."id", 'SOGP Discipleship Group', candidate, true);
  END LOOP;
END $$;--> statement-breakpoint

CREATE UNIQUE INDEX "discipleship_groups_default_leader_idx" ON "discipleship_groups" USING btree ("leader_enrollment_id") WHERE "is_default" = true;--> statement-breakpoint

CREATE TABLE "church_branch_memberships" (
  "user_id" text PRIMARY KEY NOT NULL,
  "branch_id" integer NOT NULL,
  "assigned_by" text NOT NULL,
  "assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "church_branch_memberships" ADD CONSTRAINT "church_branch_memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "church_branch_memberships" ADD CONSTRAINT "church_branch_memberships_branch_id_church_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."church_branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "church_branch_memberships" ADD CONSTRAINT "church_branch_memberships_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "church_branch_memberships_branch_idx" ON "church_branch_memberships" USING btree ("branch_id");--> statement-breakpoint

CREATE TABLE "sogp_enrollment_branches" (
  "enrollment_id" integer PRIMARY KEY NOT NULL,
  "branch_id" integer NOT NULL,
  "assigned_by" text NOT NULL,
  "assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "sogp_enrollment_branches" ADD CONSTRAINT "sogp_enrollment_branches_enrollment_id_sogp_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."sogp_enrollments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sogp_enrollment_branches" ADD CONSTRAINT "sogp_enrollment_branches_branch_id_church_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."church_branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sogp_enrollment_branches" ADD CONSTRAINT "sogp_enrollment_branches_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sogp_enrollment_branches_branch_idx" ON "sogp_enrollment_branches" USING btree ("branch_id");--> statement-breakpoint

CREATE TYPE "public"."sogp_branch_transfer_status" AS ENUM('pending', 'accepted', 'declined', 'cancelled');--> statement-breakpoint
CREATE TABLE "sogp_branch_transfers" (
  "id" serial PRIMARY KEY NOT NULL,
  "enrollment_id" integer NOT NULL,
  "from_branch_id" integer,
  "to_branch_id" integer NOT NULL,
  "requested_by" text NOT NULL,
  "responded_by" text,
  "status" "sogp_branch_transfer_status" DEFAULT 'pending' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "responded_at" timestamp with time zone
);--> statement-breakpoint
ALTER TABLE "sogp_branch_transfers" ADD CONSTRAINT "sogp_branch_transfers_enrollment_id_sogp_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."sogp_enrollments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sogp_branch_transfers" ADD CONSTRAINT "sogp_branch_transfers_from_branch_id_church_branches_id_fk" FOREIGN KEY ("from_branch_id") REFERENCES "public"."church_branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sogp_branch_transfers" ADD CONSTRAINT "sogp_branch_transfers_to_branch_id_church_branches_id_fk" FOREIGN KEY ("to_branch_id") REFERENCES "public"."church_branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sogp_branch_transfers" ADD CONSTRAINT "sogp_branch_transfers_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sogp_branch_transfers" ADD CONSTRAINT "sogp_branch_transfers_responded_by_users_id_fk" FOREIGN KEY ("responded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "sogp_branch_transfers_pending_enrollment_idx" ON "sogp_branch_transfers" USING btree ("enrollment_id") WHERE "status" = 'pending';--> statement-breakpoint
CREATE INDEX "sogp_branch_transfers_destination_idx" ON "sogp_branch_transfers" USING btree ("to_branch_id", "status");
