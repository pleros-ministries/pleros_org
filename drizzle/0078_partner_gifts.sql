-- Partner gifts (user, 10 November): a giver's own record of what they have
-- given to Pleros. People add bank transfers, cash and other gifts by hand;
-- online gifts confirmed by Paystack are added for signed-in givers, once per
-- reference. Amounts are in minor units (kobo or cents). No data changes.
CREATE TABLE "partner_gifts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"amount_minor" bigint NOT NULL,
	"currency" text NOT NULL,
	"channel" text NOT NULL,
	"given_on" date NOT NULL,
	"note" text,
	"paystack_reference" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "partner_gifts_amount_check" CHECK ("partner_gifts"."amount_minor" > 0),
	CONSTRAINT "partner_gifts_currency_check" CHECK ("partner_gifts"."currency" in ('NGN','USD')),
	CONSTRAINT "partner_gifts_channel_check" CHECK ("partner_gifts"."channel" in ('bank','online','cash','other')),
	CONSTRAINT "partner_gifts_note_len" CHECK ("partner_gifts"."note" is null or char_length("partner_gifts"."note") <= 280)
);--> statement-breakpoint
ALTER TABLE "partner_gifts" ADD CONSTRAINT "partner_gifts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "partner_gifts_user_idx" ON "partner_gifts" USING btree ("user_id","given_on");--> statement-breakpoint
CREATE UNIQUE INDEX "partner_gifts_paystack_reference_idx" ON "partner_gifts" USING btree ("paystack_reference");
