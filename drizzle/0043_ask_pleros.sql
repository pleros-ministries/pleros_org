ALTER TYPE "public"."community_notification_kind" ADD VALUE 'pleros_reply';--> statement-breakpoint
CREATE TABLE "pleros_question_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"question_id" integer NOT NULL,
	"from_staff" boolean NOT NULL,
	"staff_author_id" text,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pleros_question_mutes" (
	"user_id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pleros_questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"asker_id" text NOT NULL,
	"is_anonymous" boolean NOT NULL,
	"status" "qa_status" DEFAULT 'open' NOT NULL,
	"asker_unread" boolean DEFAULT false NOT NULL,
	"last_message_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pleros_question_messages" ADD CONSTRAINT "pleros_question_messages_question_id_pleros_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."pleros_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pleros_question_messages" ADD CONSTRAINT "pleros_question_messages_staff_author_id_users_id_fk" FOREIGN KEY ("staff_author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pleros_question_mutes" ADD CONSTRAINT "pleros_question_mutes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pleros_questions" ADD CONSTRAINT "pleros_questions_asker_id_users_id_fk" FOREIGN KEY ("asker_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pleros_question_messages_question_idx" ON "pleros_question_messages" USING btree ("question_id","id");--> statement-breakpoint
CREATE INDEX "pleros_questions_asker_idx" ON "pleros_questions" USING btree ("asker_id","last_message_at");--> statement-breakpoint
CREATE INDEX "pleros_questions_status_idx" ON "pleros_questions" USING btree ("status","last_message_at");