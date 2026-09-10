ALTER TYPE "public"."community_notification_kind" ADD VALUE 'post_comment' BEFORE 'made_leader';--> statement-breakpoint
ALTER TYPE "public"."community_notification_kind" ADD VALUE 'comment_reply' BEFORE 'made_leader';--> statement-breakpoint
ALTER TYPE "public"."community_post_author_kind" ADD VALUE 'member';--> statement-breakpoint
ALTER TYPE "public"."content_flag_target" ADD VALUE 'comment';--> statement-breakpoint
CREATE TABLE "comment_reactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"comment_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"kind" text DEFAULT 'like' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_post_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" integer NOT NULL,
	"author_id" text NOT NULL,
	"body" text NOT NULL,
	"status" "community_message_status" DEFAULT 'visible' NOT NULL,
	"reply_to_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "community_messages" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "community_threads" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "message_reactions" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "community_messages" CASCADE;--> statement-breakpoint
DROP TABLE "community_threads" CASCADE;--> statement-breakpoint
DROP TABLE "message_reactions" CASCADE;--> statement-breakpoint
ALTER TABLE "community_posts" ADD COLUMN "images" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "community_posts" ADD COLUMN "comment_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "community_posts" ADD COLUMN "share_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "community_posts" ADD COLUMN "shared_from_post_id" integer;--> statement-breakpoint
ALTER TABLE "community_posts" ADD COLUMN "last_activity_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "comment_reactions" ADD CONSTRAINT "comment_reactions_comment_id_community_post_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."community_post_comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment_reactions" ADD CONSTRAINT "comment_reactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_post_comments" ADD CONSTRAINT "community_post_comments_post_id_community_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."community_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_post_comments" ADD CONSTRAINT "community_post_comments_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_post_comments" ADD CONSTRAINT "community_post_comments_reply_to_id_community_post_comments_id_fk" FOREIGN KEY ("reply_to_id") REFERENCES "public"."community_post_comments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "comment_reactions_comment_user_kind_idx" ON "comment_reactions" USING btree ("comment_id","user_id","kind");--> statement-breakpoint
CREATE INDEX "community_post_comments_post_created_idx" ON "community_post_comments" USING btree ("post_id","created_at");--> statement-breakpoint
ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_shared_from_post_id_community_posts_id_fk" FOREIGN KEY ("shared_from_post_id") REFERENCES "public"."community_posts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "community_posts_scope_activity_idx" ON "community_posts" USING btree ("scope","last_activity_at");--> statement-breakpoint
DROP TYPE "public"."community_thread_status";