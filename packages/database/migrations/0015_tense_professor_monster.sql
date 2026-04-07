CREATE TABLE "streamer_note" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"text" text DEFAULT '' NOT NULL,
	"streamer_id" text NOT NULL,
	"profile_id" text NOT NULL,
	CONSTRAINT "streamer_note_streamer_profile" UNIQUE("streamer_id","profile_id")
);
