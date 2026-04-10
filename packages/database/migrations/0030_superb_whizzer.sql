CREATE TABLE "streamer_tag" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"streamer_id" text NOT NULL,
	"name" text NOT NULL,
	"color" text DEFAULT 'gray' NOT NULL,
	CONSTRAINT "streamer_tag_streamer_name" UNIQUE("streamer_id","name")
);
--> statement-breakpoint
CREATE TABLE "streamer_viewer_tag" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"streamer_viewer_id" text NOT NULL,
	"tag_id" text NOT NULL,
	CONSTRAINT "streamer_viewer_tag_unique" UNIQUE("streamer_viewer_id","tag_id")
);
