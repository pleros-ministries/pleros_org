CREATE TABLE "people_follow_up_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_user_id" text NOT NULL,
	"enrollment_id" integer,
	"private_contact_id" integer,
	"kind" text NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "people_follow_up_logs_subject_check" CHECK (("enrollment_id" IS NULL) <> ("private_contact_id" IS NULL)),
	CONSTRAINT "people_follow_up_logs_kind_check" CHECK ("kind" in ('whatsapp','call','visit','message','note')),
	CONSTRAINT "people_follow_up_logs_note_check" CHECK ("note" IS NULL OR length("note") <= 500)
);--> statement-breakpoint
ALTER TABLE "people_follow_up_logs" ADD CONSTRAINT "people_follow_up_logs_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "people_follow_up_logs" ADD CONSTRAINT "people_follow_up_logs_enrollment_id_sogp_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."sogp_enrollments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "people_follow_up_logs" ADD CONSTRAINT "people_follow_up_logs_private_contact_id_private_ministry_contacts_id_fk" FOREIGN KEY ("private_contact_id") REFERENCES "public"."private_ministry_contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "people_follow_up_logs_enrollment_idx" ON "people_follow_up_logs" USING btree ("enrollment_id","created_at");--> statement-breakpoint
CREATE INDEX "people_follow_up_logs_contact_idx" ON "people_follow_up_logs" USING btree ("private_contact_id","created_at");--> statement-breakpoint
CREATE INDEX "people_follow_up_logs_owner_idx" ON "people_follow_up_logs" USING btree ("owner_user_id");--> statement-breakpoint
CREATE TABLE "private_contact_invites" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_user_id" text NOT NULL,
	"private_contact_id" integer NOT NULL,
	"group_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "private_contact_invites" ADD CONSTRAINT "private_contact_invites_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "private_contact_invites" ADD CONSTRAINT "private_contact_invites_private_contact_id_private_ministry_contacts_id_fk" FOREIGN KEY ("private_contact_id") REFERENCES "public"."private_ministry_contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "private_contact_invites" ADD CONSTRAINT "private_contact_invites_group_id_discipleship_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."discipleship_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "private_contact_invites_contact_idx" ON "private_contact_invites" USING btree ("private_contact_id","created_at");
