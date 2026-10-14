CREATE TABLE "sogp_episode_playback" (
	"user_id" text NOT NULL,
	"episode_guid" text NOT NULL,
	"position_seconds" double precision NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sogp_episode_playback_user_id_episode_guid_pk" PRIMARY KEY("user_id","episode_guid"),
	CONSTRAINT "sogp_episode_playback_position_check" CHECK ("sogp_episode_playback"."position_seconds" >= 0 and "sogp_episode_playback"."position_seconds" < 'Infinity'::float8),
	CONSTRAINT "sogp_episode_playback_revision_check" CHECK ("sogp_episode_playback"."revision" > 0)
);
--> statement-breakpoint
CREATE TABLE "sogp_learning_plan_items" (
	"user_id" text NOT NULL,
	"source" text NOT NULL,
	"position" integer NOT NULL,
	"episode_guid" text NOT NULL,
	CONSTRAINT "sogp_learning_plan_items_user_id_source_position_pk" PRIMARY KEY("user_id","source","position"),
	CONSTRAINT "sogp_learning_plan_items_source_check" CHECK ("sogp_learning_plan_items"."source" in ('queue','history')),
	CONSTRAINT "sogp_learning_plan_items_position_check" CHECK ("sogp_learning_plan_items"."position" >= 0),
	CONSTRAINT "sogp_learning_plan_items_guid_check" CHECK (length(trim("sogp_learning_plan_items"."episode_guid")) > 0)
);
--> statement-breakpoint
CREATE TABLE "sogp_learning_preferences" (
	"user_id" text PRIMARY KEY NOT NULL,
	"path" text NOT NULL,
	"episodes_per_day" integer NOT NULL,
	"has_podcast_plan" boolean DEFAULT false NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sogp_learning_preferences_path_check" CHECK ("sogp_learning_preferences"."path" in ('traditional','podcast_one','podcast_two')),
	CONSTRAINT "sogp_learning_preferences_pace_check" CHECK ("sogp_learning_preferences"."episodes_per_day" in (1,2) and ("sogp_learning_preferences"."path" = 'traditional' or ("sogp_learning_preferences"."path" = 'podcast_one' and "sogp_learning_preferences"."episodes_per_day" = 1) or ("sogp_learning_preferences"."path" = 'podcast_two' and "sogp_learning_preferences"."episodes_per_day" = 2))),
	CONSTRAINT "sogp_learning_preferences_revision_check" CHECK ("sogp_learning_preferences"."revision" > 0)
);
--> statement-breakpoint
ALTER TABLE "sogp_episode_playback" ADD CONSTRAINT "sogp_episode_playback_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sogp_learning_plan_items" ADD CONSTRAINT "sogp_learning_plan_items_user_id_sogp_learning_preferences_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."sogp_learning_preferences"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sogp_learning_preferences" ADD CONSTRAINT "sogp_learning_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "sogp_learning_plan_items_episode_idx" ON "sogp_learning_plan_items" USING btree ("user_id","episode_guid");