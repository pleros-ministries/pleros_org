CREATE TABLE "community_restrictions" (
	"user_id" text PRIMARY KEY NOT NULL,
	"posting_blocked" boolean DEFAULT false NOT NULL,
	"messaging_blocked" boolean DEFAULT false NOT NULL,
	"reason" text,
	"set_by" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "community_restrictions" ADD CONSTRAINT "community_restrictions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_restrictions" ADD CONSTRAINT "community_restrictions_set_by_users_id_fk" FOREIGN KEY ("set_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;