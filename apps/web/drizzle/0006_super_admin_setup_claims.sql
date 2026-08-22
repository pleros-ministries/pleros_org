CREATE TABLE "super_admin_setup_claims" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"token_hash" text NOT NULL,
	"consumed_at" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "super_admin_setup_claims_email_idx" ON "super_admin_setup_claims" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "super_admin_setup_claims_token_hash_idx" ON "super_admin_setup_claims" USING btree ("token_hash");
