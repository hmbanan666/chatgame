ALTER TABLE "profile" ADD COLUMN "streamer_request_status" text;--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "streamer_request_paid_coins" integer DEFAULT 0 NOT NULL;