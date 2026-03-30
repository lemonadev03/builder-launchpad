ALTER TABLE "moderation_action" ALTER COLUMN "community_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "suspended_at" timestamp;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
CREATE INDEX "user_suspended_at_idx" ON "user" USING btree ("suspended_at");--> statement-breakpoint
CREATE INDEX "user_deleted_at_idx" ON "user" USING btree ("deleted_at");