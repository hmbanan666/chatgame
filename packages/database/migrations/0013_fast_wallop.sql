CREATE TABLE "sprite_frame" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"pixels" jsonb NOT NULL,
	"sprite_id" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sprite" DROP COLUMN "frames";