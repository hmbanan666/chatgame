DROP TABLE "leaderboard_member" CASCADE;--> statement-breakpoint
DROP TABLE "leaderboard" CASCADE;--> statement-breakpoint
DROP TABLE "trophy" CASCADE;--> statement-breakpoint
DROP TABLE "trophy_edition" CASCADE;--> statement-breakpoint
ALTER TABLE "profile" DROP COLUMN "points";--> statement-breakpoint
ALTER TABLE "profile" DROP COLUMN "patron_points";--> statement-breakpoint
ALTER TABLE "profile" DROP COLUMN "trophy_hunter_points";--> statement-breakpoint
ALTER TABLE "profile" DROP COLUMN "ranger_points";--> statement-breakpoint
ALTER TABLE "profile" DROP COLUMN "storyteller_points";--> statement-breakpoint
ALTER TABLE "profile" DROP COLUMN "collector_points";