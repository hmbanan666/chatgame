DROP TABLE "quest_edition" CASCADE;--> statement-breakpoint
DROP TABLE "quest_reward" CASCADE;--> statement-breakpoint
DROP TABLE "quest" CASCADE;--> statement-breakpoint
ALTER TABLE "backlog_item" ADD COLUMN "quest_profile_id" text;--> statement-breakpoint
ALTER TABLE "backlog_item" ADD COLUMN "quest_template_id" text;--> statement-breakpoint
ALTER TABLE "backlog_item" ADD COLUMN "quest_progress" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "backlog_item" ADD COLUMN "quest_goal" integer;--> statement-breakpoint
ALTER TABLE "backlog_item" ADD COLUMN "quest_reward" integer;