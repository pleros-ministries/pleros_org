ALTER TYPE "public"."user_role" ADD VALUE 'pastor';--> statement-breakpoint
CREATE TABLE "pastor_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"enrollment_id" integer NOT NULL,
	"pastor_user_id" text NOT NULL,
	"assigned_by" text,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_contacted_at" timestamp with time zone,
	"contact_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pastor_assignments" ADD CONSTRAINT "pastor_assignments_enrollment_id_sogp_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."sogp_enrollments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pastor_assignments" ADD CONSTRAINT "pastor_assignments_pastor_user_id_users_id_fk" FOREIGN KEY ("pastor_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pastor_assignments" ADD CONSTRAINT "pastor_assignments_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "pastor_assignments_enrollment_idx" ON "pastor_assignments" USING btree ("enrollment_id");--> statement-breakpoint
CREATE INDEX "pastor_assignments_pastor_idx" ON "pastor_assignments" USING btree ("pastor_user_id");