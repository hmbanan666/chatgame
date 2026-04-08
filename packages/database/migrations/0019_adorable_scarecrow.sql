CREATE TABLE "redemption" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"streamer_id" text NOT NULL,
	"stream_id" text,
	"twitch_user_id" text NOT NULL,
	"user_name" text NOT NULL,
	"reward_id" text NOT NULL,
	"reward_title" text NOT NULL,
	"reward_cost" integer NOT NULL
);
