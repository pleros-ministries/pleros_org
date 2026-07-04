ALTER TYPE "public"."qa_author_role" ADD VALUE 'super_admin';--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE 'super_admin' BEFORE 'admin';--> statement-breakpoint
CREATE TABLE "prayer_watch_attendance" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"attended_date" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "school_of_purpose_waitlist" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff_invites" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"role" "user_role" NOT NULL,
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
CREATE TABLE "welcome_pack_leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"source" text DEFAULT 'welcome' NOT NULL,
	"main_access_granted" boolean DEFAULT true NOT NULL,
	"extra_gifts_unlocked" boolean DEFAULT false NOT NULL,
	"shared_confirmed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lessons" ADD COLUMN "response_prompt" text;--> statement-breakpoint
ALTER TABLE "lessons" ADD COLUMN "response_marking_guide" text;--> statement-breakpoint
ALTER TABLE "prayer_watch_attendance" ADD CONSTRAINT "prayer_watch_attendance_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_invites" ADD CONSTRAINT "staff_invites_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_invites" ADD CONSTRAINT "staff_invites_accepted_by_users_id_fk" FOREIGN KEY ("accepted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "prayer_watch_attendance_user_date_idx" ON "prayer_watch_attendance" USING btree ("user_id","attended_date");--> statement-breakpoint
CREATE INDEX "prayer_watch_attendance_user_idx" ON "prayer_watch_attendance" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "school_of_purpose_waitlist_email_idx" ON "school_of_purpose_waitlist" USING btree ("email");--> statement-breakpoint
CREATE INDEX "school_of_purpose_waitlist_created_at_idx" ON "school_of_purpose_waitlist" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "staff_invites_email_idx" ON "staff_invites" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "staff_invites_token_hash_idx" ON "staff_invites" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "staff_invites_invited_by_idx" ON "staff_invites" USING btree ("invited_by");--> statement-breakpoint
CREATE UNIQUE INDEX "welcome_pack_leads_email_idx" ON "welcome_pack_leads" USING btree ("email");--> statement-breakpoint
CREATE INDEX "welcome_pack_leads_created_at_idx" ON "welcome_pack_leads" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "welcome_pack_leads_extra_gifts_idx" ON "welcome_pack_leads" USING btree ("extra_gifts_unlocked");