import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

// ── Better Auth core tables ─────────────────────────────────────────

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  isPlatformAdmin: boolean("is_platform_admin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_user_id_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("account_user_id_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

// ── Profile ─────────────────────────────────────────────────────────

export type SocialLinks = {
  linkedin?: string;
  github?: string;
  twitter?: string;
  discord?: string;
  website?: string;
  email?: string;
};

export const profile = pgTable(
  "profile",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "cascade" }),
    displayName: text("display_name").notNull(),
    username: text("username").notNull().unique(),
    bio: text("bio"),
    tagline: text("tagline"),
    avatarUrl: text("avatar_url"),
    bannerUrl: text("banner_url"),
    location: text("location"),
    educationSchool: text("education_school"),
    educationProgram: text("education_program"),
    educationYear: text("education_year"),
    socialLinks: jsonb("social_links").$type<SocialLinks>().default({}),
    onboardingCompletedAt: timestamp("onboarding_completed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("profile_user_id_idx").on(table.userId),
    index("profile_username_idx").on(table.username),
  ],
);

// ── Tags (platform-managed predefined list) ─────────────────────────

export const tag = pgTable("tag", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  label: text("label").notNull(),
  color: text("color"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const profileTag = pgTable(
  "profile_tag",
  {
    profileId: text("profile_id")
      .notNull()
      .references(() => profile.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tag.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.profileId, table.tagId] })],
);

// ── Communities ──────────────────────────────────────────────────────

export const community = pgTable(
  "community",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    tagline: text("tagline"),
    location: text("location"),
    logoUrl: text("logo_url"),
    bannerUrl: text("banner_url"),
    primaryColor: text("primary_color"),
    visibility: text("visibility", { enum: ["listed", "unlisted"] })
      .default("listed")
      .notNull(),
    joinPolicy: text("join_policy", {
      enum: ["invite_only", "request_to_join", "open"],
    })
      .default("invite_only")
      .notNull(),
    // Self-referencing parent — FK added manually in migration (Drizzle self-ref limitation)
    parentId: text("parent_id"),
    depth: integer("depth").default(0).notNull(),
    subTierLabel: text("sub_tier_label"),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    archivedAt: timestamp("archived_at"),
  },
  (table) => [
    index("community_slug_idx").on(table.slug),
    index("community_created_by_idx").on(table.createdBy),
    index("community_parent_id_idx").on(table.parentId),
  ],
);

// ── Invites ─────────────────────────────────────────────────────────

export const invite = pgTable(
  "invite",
  {
    id: text("id").primaryKey(),
    token: text("token").notNull().unique(),
    communityId: text("community_id")
      .notNull()
      .references(() => community.id, { onDelete: "cascade" }),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    email: text("email"),
    emailStatus: text("email_status", { enum: ["sent", "redeemed"] }),
    revokedAt: timestamp("revoked_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("invite_token_idx").on(table.token),
    index("invite_community_id_idx").on(table.communityId),
  ],
);

// ── Join Requests ───────────────────────────────────────────────────

export const joinRequest = pgTable(
  "join_request",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    communityId: text("community_id")
      .notNull()
      .references(() => community.id, { onDelete: "cascade" }),
    status: text("status", { enum: ["pending", "approved", "rejected"] })
      .default("pending")
      .notNull(),
    requestedAt: timestamp("requested_at").defaultNow().notNull(),
    resolvedAt: timestamp("resolved_at"),
    resolvedBy: text("resolved_by").references(() => user.id, {
      onDelete: "set null",
    }),
  },
  (table) => [
    unique("join_request_user_community_uniq").on(
      table.userId,
      table.communityId,
    ),
    index("join_request_community_id_idx").on(table.communityId),
    index("join_request_user_id_idx").on(table.userId),
  ],
);

// ── Membership ──────────────────────────────────────────────────────

export const membership = pgTable(
  "membership",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    communityId: text("community_id")
      .notNull()
      .references(() => community.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["admin", "moderator", "member"] })
      .default("member")
      .notNull(),
    status: text("status", { enum: ["active", "pending", "suspended"] })
      .default("active")
      .notNull(),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
    leftAt: timestamp("left_at"),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    unique("membership_user_community_uniq").on(table.userId, table.communityId),
    index("membership_user_id_idx").on(table.userId),
    index("membership_community_id_idx").on(table.communityId),
  ],
);

// ── Blog Posts ──────────────────────────────────────────────────────

export const post = pgTable(
  "post",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    content: jsonb("content").notNull(),
    excerpt: text("excerpt"),
    tags: jsonb("tags").$type<string[]>().default([]),
    communityId: text("community_id")
      .notNull()
      .references(() => community.id, { onDelete: "cascade" }),
    authorId: text("author_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    status: text("status", { enum: ["draft", "published"] })
      .default("draft")
      .notNull(),
    publishedAt: timestamp("published_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    archivedAt: timestamp("archived_at"),
  },
  (table) => [
    index("post_community_id_idx").on(table.communityId),
    index("post_author_id_idx").on(table.authorId),
    index("post_slug_community_idx").on(table.slug, table.communityId),
    index("post_status_idx").on(table.status),
  ],
);
