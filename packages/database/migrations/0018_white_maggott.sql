CREATE TABLE "widget_token" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"streamer_id" text NOT NULL,
	"room_id" text NOT NULL
);
