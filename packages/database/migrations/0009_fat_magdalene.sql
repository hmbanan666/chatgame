CREATE TABLE "stream" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp (3) with time zone,
	"is_live" boolean DEFAULT true NOT NULL,
	"fuel" integer DEFAULT 50 NOT NULL,
	"messages_count" integer DEFAULT 0 NOT NULL,
	"fuel_added" integer DEFAULT 0 NOT NULL,
	"fuel_stolen" integer DEFAULT 0 NOT NULL,
	"trees_chopped" integer DEFAULT 0 NOT NULL,
	"donations_count" integer DEFAULT 0 NOT NULL,
	"donations_total" integer DEFAULT 0 NOT NULL,
	"total_redemptions" integer DEFAULT 0 NOT NULL,
	"peak_viewers" integer DEFAULT 0 NOT NULL,
	"average_viewers" integer DEFAULT 0 NOT NULL,
	"streamer_id" text NOT NULL
);
