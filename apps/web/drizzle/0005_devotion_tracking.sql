CREATE TABLE "bible_reading_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"reading_date" date NOT NULL,
	"chapters_read" integer NOT NULL,
	"current_book" text NOT NULL,
	"current_chapter" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "podcast_episode_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"episode_guid" text NOT NULL,
	"listened_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bible_reading_logs" ADD CONSTRAINT "bible_reading_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "podcast_episode_progress" ADD CONSTRAINT "podcast_episode_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "bible_reading_logs_user_date_idx" ON "bible_reading_logs" USING btree ("user_id","reading_date");
--> statement-breakpoint
CREATE INDEX "bible_reading_logs_user_idx" ON "bible_reading_logs" USING btree ("user_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "podcast_episode_progress_user_episode_idx" ON "podcast_episode_progress" USING btree ("user_id","episode_guid");
--> statement-breakpoint
CREATE INDEX "podcast_episode_progress_user_idx" ON "podcast_episode_progress" USING btree ("user_id");
