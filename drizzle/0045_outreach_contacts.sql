CREATE TABLE "outreach_contacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"met_date" date NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"note" text,
	"followed_up_at" timestamp with time zone,
	"followed_up_by" text,
	"follow_up_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "outreach_contacts" ADD CONSTRAINT "outreach_contacts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outreach_contacts" ADD CONSTRAINT "outreach_contacts_followed_up_by_users_id_fk" FOREIGN KEY ("followed_up_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "outreach_contacts_user_date_idx" ON "outreach_contacts" USING btree ("user_id","met_date");--> statement-breakpoint
CREATE INDEX "outreach_contacts_date_idx" ON "outreach_contacts" USING btree ("met_date");