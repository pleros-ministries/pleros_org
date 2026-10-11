CREATE TABLE "church_assignments" (
	"user_id" text PRIMARY KEY NOT NULL,
	"role" text NOT NULL,
	"branch_id" integer,
	"unit_id" integer,
	"supervisor_id" text,
	"assigned_by" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "church_assignment_shape" CHECK (("church_assignments"."role" = 'pastor' and "church_assignments"."branch_id" is null and "church_assignments"."unit_id" is null and "church_assignments"."supervisor_id" is null) or ("church_assignments"."role" = 'branch_pastor' and "church_assignments"."branch_id" is not null and "church_assignments"."unit_id" is null and "church_assignments"."supervisor_id" is not null) or ("church_assignments"."role" in ('unit_leader', 'worker') and "church_assignments"."branch_id" is not null and "church_assignments"."unit_id" is not null and "church_assignments"."supervisor_id" is not null)),
	CONSTRAINT "church_assignment_no_self_supervision" CHECK ("church_assignments"."supervisor_id" is null or "church_assignments"."supervisor_id" <> "church_assignments"."user_id")
);
--> statement-breakpoint
CREATE TABLE "church_branches" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "church_units" (
	"id" serial PRIMARY KEY NOT NULL,
	"branch_id" integer NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "church_assignments" ADD CONSTRAINT "church_assignments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "church_assignments" ADD CONSTRAINT "church_assignments_branch_id_church_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."church_branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "church_assignments" ADD CONSTRAINT "church_assignments_unit_id_church_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."church_units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "church_assignments" ADD CONSTRAINT "church_assignments_supervisor_id_users_id_fk" FOREIGN KEY ("supervisor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "church_assignments" ADD CONSTRAINT "church_assignments_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "church_units" ADD CONSTRAINT "church_units_branch_id_church_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."church_branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "church_assignments_supervisor_idx" ON "church_assignments" USING btree ("supervisor_id");--> statement-breakpoint
CREATE INDEX "church_assignments_branch_idx" ON "church_assignments" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "church_assignments_unit_idx" ON "church_assignments" USING btree ("unit_id");--> statement-breakpoint
CREATE UNIQUE INDEX "church_assignments_one_pastor_idx" ON "church_assignments" USING btree ("role") WHERE "church_assignments"."role" = 'pastor';--> statement-breakpoint
CREATE UNIQUE INDEX "church_branches_name_idx" ON "church_branches" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "church_units_branch_name_idx" ON "church_units" USING btree ("branch_id","name");