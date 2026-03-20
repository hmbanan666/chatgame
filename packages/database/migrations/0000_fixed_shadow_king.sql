CREATE TABLE IF NOT EXISTS "profile" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"twitch_id" text,
	"user_name" text,
	"is_streamer" boolean DEFAULT false NOT NULL,
	"coupons" integer DEFAULT 0 NOT NULL,
	"coins" integer DEFAULT 0 NOT NULL,
	"mana" integer DEFAULT 0 NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	"patron_points" integer DEFAULT 0 NOT NULL,
	"trophy_hunter_points" integer DEFAULT 0 NOT NULL,
	"ranger_points" integer DEFAULT 0 NOT NULL,
	"storyteller_points" integer DEFAULT 0 NOT NULL,
	"collector_points" integer DEFAULT 0 NOT NULL,
	"active_edition_id" text
);

CREATE TABLE IF NOT EXISTS "payment" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"external_id" text NOT NULL,
	"provider" text NOT NULL,
	"status" text NOT NULL,
	"amount" integer DEFAULT 0 NOT NULL,
	"product_id" text NOT NULL,
	"profile_id" text NOT NULL
);

CREATE TABLE IF NOT EXISTS "product" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"finish_at" timestamp (3) with time zone,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"coins" integer DEFAULT 0 NOT NULL,
	"bonus_coins" integer DEFAULT 0 NOT NULL,
	"price" integer DEFAULT 0 NOT NULL,
	"regular_price" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"single_purchase" boolean DEFAULT false NOT NULL
);

CREATE TABLE IF NOT EXISTS "product_item" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"type" text NOT NULL,
	"amount" integer DEFAULT 0 NOT NULL,
	"entity_id" text,
	"priority" integer DEFAULT 0 NOT NULL,
	"product_id" text NOT NULL
);

CREATE TABLE IF NOT EXISTS "twitch_token" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"online_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"status" text NOT NULL,
	"type" text NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	"language" text DEFAULT 'ru' NOT NULL,
	"access_token_id" text,
	"profile_id" text NOT NULL
);

CREATE TABLE IF NOT EXISTS "twitch_access_token" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text,
	"scope" text[],
	"expires_in" integer,
	"obtainment_timestamp" text NOT NULL
);

CREATE TABLE IF NOT EXISTS "village" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"global_target" integer,
	"global_target_success" integer,
	"wood" integer DEFAULT 0 NOT NULL,
	"stone" integer DEFAULT 0 NOT NULL
);

CREATE TABLE IF NOT EXISTS "player" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"last_action_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"coins" integer DEFAULT 0 NOT NULL,
	"reputation" integer DEFAULT 0 NOT NULL,
	"viewer_points" integer DEFAULT 0 NOT NULL,
	"villain_points" integer DEFAULT 0 NOT NULL,
	"refueller_points" integer DEFAULT 0 NOT NULL,
	"raider_points" integer DEFAULT 0 NOT NULL,
	"inventory_id" text NOT NULL,
	"profile_id" text NOT NULL
);

CREATE TABLE IF NOT EXISTS "skill" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"type" text NOT NULL,
	"lvl" integer DEFAULT 0 NOT NULL,
	"xp" integer DEFAULT 0 NOT NULL,
	"xp_next_lvl" integer DEFAULT 20 NOT NULL,
	"object_id" text NOT NULL
);

CREATE TABLE IF NOT EXISTS "inventory_item" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"type" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL
);

CREATE TABLE IF NOT EXISTS "inventory_item_edition" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"amount" integer DEFAULT 0 NOT NULL,
	"durability" integer DEFAULT 100 NOT NULL,
	"item_id" text NOT NULL,
	"profile_id" text NOT NULL
);

CREATE TABLE IF NOT EXISTS "character" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"codename" text NOT NULL,
	"nickname" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"is_ready" boolean DEFAULT false NOT NULL,
	"unlocked_by" text DEFAULT 'COINS' NOT NULL,
	"coefficient" integer DEFAULT 1 NOT NULL,
	"price" integer DEFAULT 0 NOT NULL
);

CREATE TABLE IF NOT EXISTS "character_edition" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"xp" integer DEFAULT 0 NOT NULL,
	"profile_id" text NOT NULL,
	"character_id" text NOT NULL
);

CREATE TABLE IF NOT EXISTS "character_level" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"level" integer NOT NULL,
	"required_xp" integer NOT NULL,
	"award_amount" integer DEFAULT 0 NOT NULL,
	"inventory_item_id" text,
	"character_id" text NOT NULL
);

CREATE TABLE IF NOT EXISTS "coupon" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"activation_command" text NOT NULL,
	"status" text NOT NULL,
	"profile_id" text
);

CREATE TABLE IF NOT EXISTS "trophy" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"points" integer NOT NULL,
	"rarity" integer DEFAULT 0 NOT NULL,
	"is_shown" boolean DEFAULT false NOT NULL,
	"has_image" boolean DEFAULT false NOT NULL
);

CREATE TABLE IF NOT EXISTS "trophy_edition" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"profile_id" text NOT NULL,
	"trophy_id" text NOT NULL
);

CREATE TABLE IF NOT EXISTS "leaderboard" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp (3) with time zone,
	"title" text NOT NULL,
	"description" text
);

CREATE TABLE IF NOT EXISTS "leaderboard_member" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	"profile_id" text NOT NULL,
	"leaderboard_id" text NOT NULL
);

CREATE TABLE IF NOT EXISTS "quest" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"points" integer NOT NULL,
	"progress_completed" integer DEFAULT 1 NOT NULL,
	"profile_id" text NOT NULL
);

CREATE TABLE IF NOT EXISTS "quest_edition" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp (3) with time zone,
	"status" text NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"profile_id" text NOT NULL,
	"quest_id" text NOT NULL
);

CREATE TABLE IF NOT EXISTS "quest_reward" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"type" text NOT NULL,
	"amount" integer DEFAULT 0 NOT NULL,
	"entity_id" text,
	"quest_id" text NOT NULL
);

CREATE TABLE IF NOT EXISTS "transaction" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"amount" integer DEFAULT 0 NOT NULL,
	"type" text NOT NULL,
	"entity_id" text NOT NULL,
	"text" text,
	"profile_id" text NOT NULL
);
