ALTER TABLE "character_edition" ADD COLUMN "play_time_min" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "watch_time_min" integer DEFAULT 0 NOT NULL;