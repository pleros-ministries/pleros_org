CREATE TABLE "dashboard_visit_summaries" (
	"id" serial PRIMARY KEY NOT NULL,
	"visitor_key" text NOT NULL,
	"visitor_type" text NOT NULL,
	"visited_date" date NOT NULL,
	"visit_count" integer DEFAULT 1 NOT NULL,
	"last_visited_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "dashboard_visit_summaries_visitor_date_idx" ON "dashboard_visit_summaries" USING btree ("visitor_key","visited_date");
--> statement-breakpoint
CREATE INDEX "dashboard_visit_summaries_visited_date_idx" ON "dashboard_visit_summaries" USING btree ("visited_date");
