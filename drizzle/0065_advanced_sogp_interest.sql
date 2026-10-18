CREATE TABLE "advanced_sogp_interest" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "advanced_sogp_interest" ADD CONSTRAINT "advanced_sogp_interest_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "advanced_sogp_interest_user_idx" ON "advanced_sogp_interest" USING btree ("user_id");
