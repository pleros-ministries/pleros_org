CREATE TABLE "teachings" (
	"id" serial PRIMARY KEY NOT NULL,
	"sn" integer NOT NULL,
	"title" text NOT NULL,
	"series" text NOT NULL,
	"date" text,
	"audio_url" text NOT NULL,
	"file_key" text NOT NULL,
	"duration" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
