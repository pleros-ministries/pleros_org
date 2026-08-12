CREATE TABLE "notification_checkpoints" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prayer_watch_reminders_sent" (
	"session_id" text NOT NULL,
	"date" date NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_web_push_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"new_content_enabled" boolean DEFAULT true NOT NULL,
	"prayer_watch_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "prayer_watch_reminders_sent_session_date_idx" ON "prayer_watch_reminders_sent" USING btree ("session_id","date");--> statement-breakpoint
CREATE UNIQUE INDEX "site_web_push_subscriptions_endpoint_idx" ON "site_web_push_subscriptions" USING btree ("endpoint");