CREATE TYPE "public"."unit_member_role" AS ENUM('member', 'leader');--> statement-breakpoint
CREATE TYPE "public"."unit_status" AS ENUM('active', 'archived');--> statement-breakpoint
CREATE TABLE "unit_leader_invites" (
	"id" serial PRIMARY KEY NOT NULL,
	"unit_id" integer NOT NULL,
	"email" text NOT NULL,
	"token_hash" text NOT NULL,
	"invited_by" text NOT NULL,
	"accepted_by" text,
	"accepted_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "unit_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"unit_id" integer NOT NULL,
	"enrollment_id" integer NOT NULL,
	"role" "unit_member_role" DEFAULT 'member' NOT NULL,
	"assigned_by" text,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "units" (
	"id" serial PRIMARY KEY NOT NULL,
	"country_code" text NOT NULL,
	"region_key" text,
	"name" text NOT NULL,
	"telegram_url" text,
	"status" "unit_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "unit_leader_invites" ADD CONSTRAINT "unit_leader_invites_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unit_leader_invites" ADD CONSTRAINT "unit_leader_invites_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unit_leader_invites" ADD CONSTRAINT "unit_leader_invites_accepted_by_users_id_fk" FOREIGN KEY ("accepted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unit_members" ADD CONSTRAINT "unit_members_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unit_members" ADD CONSTRAINT "unit_members_enrollment_id_sogp_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."sogp_enrollments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unit_members" ADD CONSTRAINT "unit_members_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "unit_leader_invites_unit_idx" ON "unit_leader_invites" USING btree ("unit_id");--> statement-breakpoint
CREATE INDEX "unit_leader_invites_email_idx" ON "unit_leader_invites" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "unit_leader_invites_token_hash_idx" ON "unit_leader_invites" USING btree ("token_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "unit_members_unit_enrollment_idx" ON "unit_members" USING btree ("unit_id","enrollment_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unit_members_enrollment_idx" ON "unit_members" USING btree ("enrollment_id");--> statement-breakpoint
CREATE INDEX "unit_members_unit_role_idx" ON "unit_members" USING btree ("unit_id","role");--> statement-breakpoint
CREATE UNIQUE INDEX "units_country_region_idx" ON "units" USING btree ("country_code",coalesce("region_key", ''));--> statement-breakpoint
CREATE INDEX "units_status_idx" ON "units" USING btree ("status");