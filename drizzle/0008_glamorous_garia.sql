CREATE INDEX "community_archived_at_idx" ON "community" USING btree ("archived_at");--> statement-breakpoint
CREATE INDEX "membership_user_status_idx" ON "membership" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "post_published_at_idx" ON "post" USING btree ("published_at");