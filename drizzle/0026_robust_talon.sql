CREATE TABLE "pastor_regions" (
	"id" serial PRIMARY KEY NOT NULL,
	"unit_id" integer NOT NULL,
	"pastor_user_id" text NOT NULL,
	"assigned_by" text,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pastor_regions" ADD CONSTRAINT "pastor_regions_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pastor_regions" ADD CONSTRAINT "pastor_regions_pastor_user_id_users_id_fk" FOREIGN KEY ("pastor_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pastor_regions" ADD CONSTRAINT "pastor_regions_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "pastor_regions_unit_idx" ON "pastor_regions" USING btree ("unit_id");--> statement-breakpoint
CREATE INDEX "pastor_regions_pastor_idx" ON "pastor_regions" USING btree ("pastor_user_id");