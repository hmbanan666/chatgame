CREATE TABLE "streamer_viewer" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"messages_count" integer DEFAULT 0 NOT NULL,
	"watch_time_min" integer DEFAULT 0 NOT NULL,
	"streamer_id" text NOT NULL,
	"profile_id" text NOT NULL,
	CONSTRAINT "streamer_viewer_streamer_profile" UNIQUE("streamer_id","profile_id")
);
--> statement-breakpoint
DROP TABLE "player" CASCADE;