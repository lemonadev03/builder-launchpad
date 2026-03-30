ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "is_company_poster" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "membership" ADD COLUMN IF NOT EXISTS "warning_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "post" ADD COLUMN IF NOT EXISTS "hidden_at" timestamp;--> statement-breakpoint
ALTER TABLE "post" ADD COLUMN IF NOT EXISTS "hidden_by" text;--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'post_hidden_by_user_id_fk'
  ) THEN
    ALTER TABLE "post"
      ADD CONSTRAINT "post_hidden_by_user_id_fk"
      FOREIGN KEY ("hidden_by") REFERENCES "public"."user"("id")
      ON DELETE set null ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "comment" (
  "id" text PRIMARY KEY NOT NULL,
  "content" jsonb NOT NULL,
  "post_id" text NOT NULL,
  "parent_comment_id" text,
  "author_id" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "deleted_at" timestamp,
  "hidden_at" timestamp,
  "hidden_by" text
);
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'comment_post_id_post_id_fk'
  ) THEN
    ALTER TABLE "comment"
      ADD CONSTRAINT "comment_post_id_post_id_fk"
      FOREIGN KEY ("post_id") REFERENCES "public"."post"("id")
      ON DELETE cascade ON UPDATE no action;
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'comment_author_id_user_id_fk'
  ) THEN
    ALTER TABLE "comment"
      ADD CONSTRAINT "comment_author_id_user_id_fk"
      FOREIGN KEY ("author_id") REFERENCES "public"."user"("id")
      ON DELETE cascade ON UPDATE no action;
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'comment_hidden_by_user_id_fk'
  ) THEN
    ALTER TABLE "comment"
      ADD CONSTRAINT "comment_hidden_by_user_id_fk"
      FOREIGN KEY ("hidden_by") REFERENCES "public"."user"("id")
      ON DELETE set null ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "comment_post_id_idx" ON "comment" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "comment_author_id_idx" ON "comment" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "comment_parent_id_idx" ON "comment" USING btree ("parent_comment_id");--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reaction" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "target_type" text NOT NULL,
  "target_id" text NOT NULL,
  "reaction_type" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "reaction_user_target_type_uniq" UNIQUE("user_id","target_type","target_id","reaction_type")
);
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'reaction_user_id_user_id_fk'
  ) THEN
    ALTER TABLE "reaction"
      ADD CONSTRAINT "reaction_user_id_user_id_fk"
      FOREIGN KEY ("user_id") REFERENCES "public"."user"("id")
      ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reaction_target_idx" ON "reaction" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reaction_user_id_idx" ON "reaction" USING btree ("user_id");--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "flag" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "target_type" text NOT NULL,
  "target_id" text NOT NULL,
  "reason" text NOT NULL,
  "description" text,
  "status" text DEFAULT 'open' NOT NULL,
  "community_id" text NOT NULL,
  "resolved_at" timestamp,
  "resolved_by" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "flag_user_target_uniq" UNIQUE("user_id","target_type","target_id")
);
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'flag_user_id_user_id_fk'
  ) THEN
    ALTER TABLE "flag"
      ADD CONSTRAINT "flag_user_id_user_id_fk"
      FOREIGN KEY ("user_id") REFERENCES "public"."user"("id")
      ON DELETE cascade ON UPDATE no action;
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'flag_community_id_community_id_fk'
  ) THEN
    ALTER TABLE "flag"
      ADD CONSTRAINT "flag_community_id_community_id_fk"
      FOREIGN KEY ("community_id") REFERENCES "public"."community"("id")
      ON DELETE cascade ON UPDATE no action;
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'flag_resolved_by_user_id_fk'
  ) THEN
    ALTER TABLE "flag"
      ADD CONSTRAINT "flag_resolved_by_user_id_fk"
      FOREIGN KEY ("resolved_by") REFERENCES "public"."user"("id")
      ON DELETE set null ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "flag_target_idx" ON "flag" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "flag_community_id_idx" ON "flag" USING btree ("community_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "flag_status_idx" ON "flag" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "flag_user_id_idx" ON "flag" USING btree ("user_id");--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "moderation_action" (
  "id" text PRIMARY KEY NOT NULL,
  "action" text NOT NULL,
  "moderator_id" text NOT NULL,
  "target_type" text NOT NULL,
  "target_id" text NOT NULL,
  "target_user_id" text,
  "reason" text,
  "community_id" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'moderation_action_moderator_id_user_id_fk'
  ) THEN
    ALTER TABLE "moderation_action"
      ADD CONSTRAINT "moderation_action_moderator_id_user_id_fk"
      FOREIGN KEY ("moderator_id") REFERENCES "public"."user"("id")
      ON DELETE cascade ON UPDATE no action;
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'moderation_action_target_user_id_user_id_fk'
  ) THEN
    ALTER TABLE "moderation_action"
      ADD CONSTRAINT "moderation_action_target_user_id_user_id_fk"
      FOREIGN KEY ("target_user_id") REFERENCES "public"."user"("id")
      ON DELETE set null ON UPDATE no action;
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'moderation_action_community_id_community_id_fk'
  ) THEN
    ALTER TABLE "moderation_action"
      ADD CONSTRAINT "moderation_action_community_id_community_id_fk"
      FOREIGN KEY ("community_id") REFERENCES "public"."community"("id")
      ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
ALTER TABLE "moderation_action" ALTER COLUMN "community_id" DROP NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mod_action_community_id_idx" ON "moderation_action" USING btree ("community_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mod_action_moderator_id_idx" ON "moderation_action" USING btree ("moderator_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mod_action_target_idx" ON "moderation_action" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mod_action_created_at_idx" ON "moderation_action" USING btree ("created_at");--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bookmark" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "target_type" text NOT NULL,
  "target_id" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "bookmark_user_target_uniq" UNIQUE("user_id","target_type","target_id")
);
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'bookmark_user_id_user_id_fk'
  ) THEN
    ALTER TABLE "bookmark"
      ADD CONSTRAINT "bookmark_user_id_user_id_fk"
      FOREIGN KEY ("user_id") REFERENCES "public"."user"("id")
      ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bookmark_user_id_idx" ON "bookmark" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bookmark_target_idx" ON "bookmark" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "company" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "logo_url" text,
  "website" text,
  "description" text,
  "created_by" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'company_created_by_user_id_fk'
  ) THEN
    ALTER TABLE "company"
      ADD CONSTRAINT "company_created_by_user_id_fk"
      FOREIGN KEY ("created_by") REFERENCES "public"."user"("id")
      ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "company_created_by_idx" ON "company" USING btree ("created_by");--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "job_listing" (
  "id" text PRIMARY KEY NOT NULL,
  "title" text NOT NULL,
  "company_id" text NOT NULL,
  "description" text NOT NULL,
  "requirements" text,
  "location" text,
  "remote" boolean DEFAULT false NOT NULL,
  "employment_type" text NOT NULL,
  "salary_range" text,
  "application_url" text NOT NULL,
  "posted_by" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "click_count" integer DEFAULT 0 NOT NULL,
  "archived_at" timestamp
);
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'job_listing_company_id_company_id_fk'
  ) THEN
    ALTER TABLE "job_listing"
      ADD CONSTRAINT "job_listing_company_id_company_id_fk"
      FOREIGN KEY ("company_id") REFERENCES "public"."company"("id")
      ON DELETE cascade ON UPDATE no action;
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'job_listing_posted_by_user_id_fk'
  ) THEN
    ALTER TABLE "job_listing"
      ADD CONSTRAINT "job_listing_posted_by_user_id_fk"
      FOREIGN KEY ("posted_by") REFERENCES "public"."user"("id")
      ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "job_listing_company_id_idx" ON "job_listing" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "job_listing_posted_by_idx" ON "job_listing" USING btree ("posted_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "job_listing_employment_type_idx" ON "job_listing" USING btree ("employment_type");--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sister_link" (
  "id" text PRIMARY KEY NOT NULL,
  "community_a_id" text NOT NULL,
  "community_b_id" text NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "requested_community_id" text NOT NULL,
  "requested_by" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "sister_link_communities_uniq" UNIQUE("community_a_id","community_b_id")
);
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'sister_link_community_a_id_community_id_fk'
  ) THEN
    ALTER TABLE "sister_link"
      ADD CONSTRAINT "sister_link_community_a_id_community_id_fk"
      FOREIGN KEY ("community_a_id") REFERENCES "public"."community"("id")
      ON DELETE cascade ON UPDATE no action;
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'sister_link_community_b_id_community_id_fk'
  ) THEN
    ALTER TABLE "sister_link"
      ADD CONSTRAINT "sister_link_community_b_id_community_id_fk"
      FOREIGN KEY ("community_b_id") REFERENCES "public"."community"("id")
      ON DELETE cascade ON UPDATE no action;
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'sister_link_requested_community_id_community_id_fk'
  ) THEN
    ALTER TABLE "sister_link"
      ADD CONSTRAINT "sister_link_requested_community_id_community_id_fk"
      FOREIGN KEY ("requested_community_id") REFERENCES "public"."community"("id")
      ON DELETE cascade ON UPDATE no action;
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'sister_link_requested_by_user_id_fk'
  ) THEN
    ALTER TABLE "sister_link"
      ADD CONSTRAINT "sister_link_requested_by_user_id_fk"
      FOREIGN KEY ("requested_by") REFERENCES "public"."user"("id")
      ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sister_link_a_idx" ON "sister_link" USING btree ("community_a_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sister_link_b_idx" ON "sister_link" USING btree ("community_b_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sister_link_status_idx" ON "sister_link" USING btree ("status");
