CREATE TABLE "church_branch_pastors" (
	"user_id" text NOT NULL,
	"branch_id" integer NOT NULL,
	CONSTRAINT "church_branch_pastors_user_id_branch_id_pk" PRIMARY KEY("user_id","branch_id")
);
--> statement-breakpoint
ALTER TABLE "church_assignments" DROP CONSTRAINT "church_assignment_shape";--> statement-breakpoint
ALTER TABLE "church_branch_pastors" ADD CONSTRAINT "church_branch_pastors_user_id_church_assignments_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."church_assignments"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "church_branch_pastors" ADD CONSTRAINT "church_branch_pastors_branch_id_church_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."church_branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "church_branch_pastors_branch_idx" ON "church_branch_pastors" USING btree ("branch_id");--> statement-breakpoint
ALTER TABLE "church_assignments" ADD CONSTRAINT "church_assignment_shape" CHECK (("church_assignments"."role" = 'pastor' and "church_assignments"."branch_id" is null and "church_assignments"."unit_id" is null and "church_assignments"."supervisor_id" is null) or ("church_assignments"."role" = 'branch_pastor' and "church_assignments"."unit_id" is null and "church_assignments"."supervisor_id" is not null) or ("church_assignments"."role" in ('unit_leader', 'worker') and "church_assignments"."branch_id" is not null and "church_assignments"."unit_id" is not null and "church_assignments"."supervisor_id" is not null));
--> statement-breakpoint
INSERT INTO "church_branch_pastors" ("user_id", "branch_id")
SELECT "user_id", "branch_id" FROM "church_assignments"
WHERE "role" = 'branch_pastor' AND "branch_id" IS NOT NULL
ON CONFLICT DO NOTHING;
