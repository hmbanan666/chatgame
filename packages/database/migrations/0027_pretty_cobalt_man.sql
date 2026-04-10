ALTER TABLE "twitch_access_token" RENAME TO "oauth_access_token";--> statement-breakpoint
ALTER TABLE "oauth_access_token" ADD COLUMN "provider" text DEFAULT 'twitch' NOT NULL;--> statement-breakpoint
ALTER TABLE "oauth_access_token" ADD CONSTRAINT "oauth_access_token_provider_user_id" UNIQUE("provider","user_id");