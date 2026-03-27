CREATE TABLE "profile" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"display_name" text NOT NULL,
	"username" text NOT NULL,
	"bio" text,
	"tagline" text,
	"avatar_url" text,
	"banner_url" text,
	"location" text,
	"education_school" text,
	"education_program" text,
	"education_year" text,
	"social_links" jsonb DEFAULT '{}'::jsonb,
	"onboarding_completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "profile_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "profile_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "profile_tag" (
	"profile_id" text NOT NULL,
	"tag_id" text NOT NULL,
	CONSTRAINT "profile_tag_profile_id_tag_id_pk" PRIMARY KEY("profile_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "tag" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"label" text NOT NULL,
	"color" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tag_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "profile" ADD CONSTRAINT "profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_tag" ADD CONSTRAINT "profile_tag_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_tag" ADD CONSTRAINT "profile_tag_tag_id_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tag"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "profile_user_id_idx" ON "profile" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "profile_username_idx" ON "profile" USING btree ("username");