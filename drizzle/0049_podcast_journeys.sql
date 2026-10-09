CREATE TABLE "podcast_journeys" (
	"user_id" text PRIMARY KEY NOT NULL,
	"track" text DEFAULT 'foundations' NOT NULL,
	"started_on" date NOT NULL,
	"leaderboard_visible" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "podcast_journeys" ADD CONSTRAINT "podcast_journeys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;