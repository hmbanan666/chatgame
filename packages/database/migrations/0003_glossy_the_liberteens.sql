CREATE TABLE "backlog_item" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"text" text NOT NULL,
	"author_name" text NOT NULL,
	"source" text DEFAULT 'donation' NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"amount" integer,
	"streamer_id" text NOT NULL
);
