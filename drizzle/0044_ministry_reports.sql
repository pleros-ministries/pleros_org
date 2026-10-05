CREATE TABLE "ministry_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"report_date" date NOT NULL,
	"reached_online" integer DEFAULT 0 NOT NULL,
	"reached_offline" integer DEFAULT 0 NOT NULL,
	"saved" integer DEFAULT 0 NOT NULL,
	"not_saved" integer DEFAULT 0 NOT NULL,
	"filled" integer DEFAULT 0 NOT NULL,
	"healed" integer DEFAULT 0 NOT NULL,
	"follow_ups" integer DEFAULT 0 NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ministry_reports" ADD CONSTRAINT "ministry_reports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ministry_reports_user_date_idx" ON "ministry_reports" USING btree ("user_id","report_date");--> statement-breakpoint
CREATE INDEX "ministry_reports_date_idx" ON "ministry_reports" USING btree ("report_date");