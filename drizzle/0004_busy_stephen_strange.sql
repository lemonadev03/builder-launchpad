CREATE TABLE "platform_admin_invite" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"invited_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"accepted_at" timestamp,
	CONSTRAINT "platform_admin_invite_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "platform_admin_invite" ADD CONSTRAINT "platform_admin_invite_invited_by_user_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "platform_admin_invite_email_idx" ON "platform_admin_invite" USING btree ("email");
--> statement-breakpoint
CREATE INDEX "platform_admin_invite_invited_by_idx" ON "platform_admin_invite" USING btree ("invited_by");
