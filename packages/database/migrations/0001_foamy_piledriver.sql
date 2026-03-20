CREATE TABLE "streamer" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"twitch_channel_id" text NOT NULL,
	"twitch_channel_name" text NOT NULL,
	"donation_alerts_user_id" text,
	"profile_id" text NOT NULL,
	CONSTRAINT "streamer_twitch_channel_id_unique" UNIQUE("twitch_channel_id")
);
