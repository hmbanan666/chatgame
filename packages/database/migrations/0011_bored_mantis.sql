CREATE TABLE "sprite" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"codename" text NOT NULL,
	"frame_size" integer DEFAULT 32 NOT NULL,
	"head_size" integer DEFAULT 80 NOT NULL,
	"slot_roles" jsonb NOT NULL,
	"default_palette" jsonb NOT NULL,
	"frames" jsonb NOT NULL,
	CONSTRAINT "sprite_codename_unique" UNIQUE("codename")
);
