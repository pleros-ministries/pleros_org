CREATE TABLE "daily_report_declarations" (
	"user_id" text NOT NULL,
	"report_date" date NOT NULL,
	"category" text NOT NULL,
	"declaration" text NOT NULL,
	"actor_user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "daily_report_declarations_user_id_report_date_category_pk" PRIMARY KEY("user_id","report_date","category"),
	CONSTRAINT "daily_report_declaration_category_check" CHECK (("daily_report_declarations"."category" = 'devotional' and "daily_report_declarations"."declaration" = 'confirmed') or ("daily_report_declarations"."category" in ('ministry', 'meetings') and "daily_report_declarations"."declaration" = 'nil')),
	CONSTRAINT "daily_report_declaration_actor_check" CHECK ("daily_report_declarations"."actor_user_id" = "daily_report_declarations"."user_id")
);
--> statement-breakpoint
CREATE TABLE "daily_report_meeting_details" (
	"activity_id" integer PRIMARY KEY NOT NULL,
	"reporting_role" text NOT NULL,
	"taught" text,
	"actor_user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "daily_report_meeting_role_check" CHECK ("daily_report_meeting_details"."reporting_role" in ('leader', 'worker', 'member')),
	CONSTRAINT "daily_report_meeting_taught_check" CHECK (("daily_report_meeting_details"."reporting_role" = 'leader' and "daily_report_meeting_details"."taught" is not null and length(trim("daily_report_meeting_details"."taught")) between 1 and 500) or ("daily_report_meeting_details"."reporting_role" in ('worker', 'member') and "daily_report_meeting_details"."taught" is null))
);
--> statement-breakpoint
ALTER TABLE "daily_report_declarations" ADD CONSTRAINT "daily_report_declarations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_report_declarations" ADD CONSTRAINT "daily_report_declarations_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_report_meeting_details" ADD CONSTRAINT "daily_report_meeting_details_activity_id_ministry_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."ministry_activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_report_meeting_details" ADD CONSTRAINT "daily_report_meeting_details_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "daily_report_declarations_date_idx" ON "daily_report_declarations" USING btree ("report_date","user_id");--> statement-breakpoint
CREATE INDEX "daily_report_meeting_details_actor_idx" ON "daily_report_meeting_details" USING btree ("actor_user_id");