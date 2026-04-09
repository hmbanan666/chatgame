CREATE TABLE "stream_engagement" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"tier1_claimed" boolean DEFAULT false NOT NULL,
	"tier2_claimed" boolean DEFAULT false NOT NULL,
	"tokens_awarded" integer DEFAULT 0 NOT NULL,
	"stream_id" text NOT NULL,
	"profile_id" text NOT NULL,
	CONSTRAINT "engagement_stream_profile" UNIQUE("stream_id","profile_id")
);
--> statement-breakpoint
CREATE TABLE "streamer_currency" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"emoji" text NOT NULL,
	"character_price" integer DEFAULT 100 NOT NULL,
	"streamer_id" text NOT NULL,
	"character_id" text,
	CONSTRAINT "streamer_currency_streamer_id_unique" UNIQUE("streamer_id")
);
--> statement-breakpoint
CREATE TABLE "streamer_currency_balance" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"balance" integer DEFAULT 0 NOT NULL,
	"streamer_id" text NOT NULL,
	"profile_id" text NOT NULL,
	CONSTRAINT "currency_balance_streamer_profile" UNIQUE("streamer_id","profile_id")
);
--> statement-breakpoint
ALTER TABLE "character" ADD COLUMN "streamer_id" text;