CREATE TYPE "public"."community_message_status" AS ENUM('visible', 'hidden', 'removed');--> statement-breakpoint
CREATE TYPE "public"."community_thread_status" AS ENUM('open', 'locked', 'removed');--> statement-breakpoint
CREATE TYPE "public"."content_flag_status" AS ENUM('open', 'actioned', 'dismissed');--> statement-breakpoint
CREATE TYPE "public"."content_flag_target" AS ENUM('post', 'thread', 'message');--> statement-breakpoint
CREATE TABLE "community_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"thread_id" integer NOT NULL,
	"author_id" text NOT NULL,
	"body" text NOT NULL,
	"status" "community_message_status" DEFAULT 'visible' NOT NULL,
	"reply_to_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_threads" (
	"id" serial PRIMARY KEY NOT NULL,
	"scope" "community_post_scope" NOT NULL,
	"unit_id" integer,
	"author_id" text NOT NULL,
	"title" text NOT NULL,
	"status" "community_thread_status" DEFAULT 'open' NOT NULL,
	"last_message_at" timestamp with time zone DEFAULT now() NOT NULL,
	"message_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_flags" (
	"id" serial PRIMARY KEY NOT NULL,
	"target_type" "content_flag_target" NOT NULL,
	"target_id" integer NOT NULL,
	"reporter_id" text NOT NULL,
	"reason" text NOT NULL,
	"status" "content_flag_status" DEFAULT 'open' NOT NULL,
	"handled_by" text,
	"handled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message_reactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"message_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"kind" text DEFAULT 'pray' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "community_messages" ADD CONSTRAINT "community_messages_thread_id_community_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."community_threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_messages" ADD CONSTRAINT "community_messages_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_messages" ADD CONSTRAINT "community_messages_reply_to_id_community_messages_id_fk" FOREIGN KEY ("reply_to_id") REFERENCES "public"."community_messages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_threads" ADD CONSTRAINT "community_threads_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_threads" ADD CONSTRAINT "community_threads_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_flags" ADD CONSTRAINT "content_flags_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_flags" ADD CONSTRAINT "content_flags_handled_by_users_id_fk" FOREIGN KEY ("handled_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_reactions" ADD CONSTRAINT "message_reactions_message_id_community_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."community_messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_reactions" ADD CONSTRAINT "message_reactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "community_messages_thread_created_idx" ON "community_messages" USING btree ("thread_id","created_at");--> statement-breakpoint
CREATE INDEX "community_threads_scope_unit_last_idx" ON "community_threads" USING btree ("scope","unit_id","last_message_at");--> statement-breakpoint
CREATE INDEX "community_threads_status_idx" ON "community_threads" USING btree ("status");--> statement-breakpoint
CREATE INDEX "content_flags_status_idx" ON "content_flags" USING btree ("status");--> statement-breakpoint
CREATE INDEX "content_flags_target_idx" ON "content_flags" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE UNIQUE INDEX "content_flags_reporter_target_idx" ON "content_flags" USING btree ("reporter_id","target_type","target_id");--> statement-breakpoint
CREATE UNIQUE INDEX "message_reactions_message_user_kind_idx" ON "message_reactions" USING btree ("message_id","user_id","kind");