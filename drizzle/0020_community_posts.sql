CREATE TYPE "public"."community_post_author_kind" AS ENUM('ministry', 'leader');--> statement-breakpoint
CREATE TYPE "public"."community_post_scope" AS ENUM('global', 'unit');--> statement-breakpoint
CREATE TYPE "public"."community_post_status" AS ENUM('published', 'hidden', 'removed');--> statement-breakpoint
CREATE TABLE "community_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"scope" "community_post_scope" NOT NULL,
	"unit_id" integer,
	"author_id" text NOT NULL,
	"author_kind" "community_post_author_kind" NOT NULL,
	"title" text,
	"body" text NOT NULL,
	"pinned" boolean DEFAULT false NOT NULL,
	"status" "community_post_status" DEFAULT 'published' NOT NULL,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post_reactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"kind" text DEFAULT 'pray' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_reactions" ADD CONSTRAINT "post_reactions_post_id_community_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."community_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_reactions" ADD CONSTRAINT "post_reactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "community_posts_scope_published_idx" ON "community_posts" USING btree ("scope","published_at");--> statement-breakpoint
CREATE INDEX "community_posts_unit_published_idx" ON "community_posts" USING btree ("unit_id","published_at");--> statement-breakpoint
CREATE INDEX "community_posts_status_idx" ON "community_posts" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "post_reactions_post_user_kind_idx" ON "post_reactions" USING btree ("post_id","user_id","kind");