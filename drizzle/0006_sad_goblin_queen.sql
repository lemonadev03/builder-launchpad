ALTER TABLE IF EXISTS "moderation_action" ALTER COLUMN "community_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "suspended_at" timestamp;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_suspended_at_idx" ON "user" USING btree ("suspended_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_deleted_at_idx" ON "user" USING btree ("deleted_at");
