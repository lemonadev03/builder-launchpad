CREATE TABLE "community" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"tagline" text,
	"location" text,
	"logo_url" text,
	"banner_url" text,
	"primary_color" text,
	"visibility" text DEFAULT 'listed' NOT NULL,
	"join_policy" text DEFAULT 'invite_only' NOT NULL,
	"parent_id" text,
	"depth" integer DEFAULT 0 NOT NULL,
	"sub_tier_label" text,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"archived_at" timestamp,
	CONSTRAINT "community_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "invite" (
	"id" text PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"community_id" text NOT NULL,
	"created_by" text NOT NULL,
	"email" text,
	"email_status" text,
	"revoked_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invite_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "join_request" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"community_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp,
	"resolved_by" text,
	CONSTRAINT "join_request_user_community_uniq" UNIQUE("user_id","community_id")
);
--> statement-breakpoint
CREATE TABLE "membership" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"community_id" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	"left_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "membership_user_community_uniq" UNIQUE("user_id","community_id")
);
--> statement-breakpoint
CREATE TABLE "post" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"content" jsonb NOT NULL,
	"excerpt" text,
	"community_id" text NOT NULL,
	"author_id" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"archived_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "is_platform_admin" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "community" ADD CONSTRAINT "community_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invite" ADD CONSTRAINT "invite_community_id_community_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."community"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invite" ADD CONSTRAINT "invite_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "join_request" ADD CONSTRAINT "join_request_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "join_request" ADD CONSTRAINT "join_request_community_id_community_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."community"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "join_request" ADD CONSTRAINT "join_request_resolved_by_user_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership" ADD CONSTRAINT "membership_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership" ADD CONSTRAINT "membership_community_id_community_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."community"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post" ADD CONSTRAINT "post_community_id_community_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."community"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post" ADD CONSTRAINT "post_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "community_slug_idx" ON "community" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "community_created_by_idx" ON "community" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "community_parent_id_idx" ON "community" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "invite_token_idx" ON "invite" USING btree ("token");--> statement-breakpoint
CREATE INDEX "invite_community_id_idx" ON "invite" USING btree ("community_id");--> statement-breakpoint
CREATE INDEX "join_request_community_id_idx" ON "join_request" USING btree ("community_id");--> statement-breakpoint
CREATE INDEX "join_request_user_id_idx" ON "join_request" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "membership_user_id_idx" ON "membership" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "membership_community_id_idx" ON "membership" USING btree ("community_id");--> statement-breakpoint
CREATE INDEX "post_community_id_idx" ON "post" USING btree ("community_id");--> statement-breakpoint
CREATE INDEX "post_author_id_idx" ON "post" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "post_slug_community_idx" ON "post" USING btree ("slug","community_id");--> statement-breakpoint
CREATE INDEX "post_status_idx" ON "post" USING btree ("status");