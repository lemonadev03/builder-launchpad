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
  isCompanyPoster: boolean("is_company_poster").default(false).notNull(),
  suspendedAt: timestamp("suspended_at"),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
}, (table) => [
  index("user_suspended_at_idx").on(table.suspendedAt),
  index("user_deleted_at_idx").on(table.deletedAt),
]);

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

export const platformAdminInvite = pgTable(
  "platform_admin_invite",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull().unique(),
    invitedBy: text("invited_by")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    acceptedAt: timestamp("accepted_at"),
  },
  (table) => [
    index("platform_admin_invite_email_idx").on(table.email),
    index("platform_admin_invite_invited_by_idx").on(table.invitedBy),
  ],
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
    isFeatured: boolean("is_featured").default(false).notNull(),
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
    warningCount: integer("warning_count").default(0).notNull(),
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
    hiddenAt: timestamp("hidden_at"),
    hiddenBy: text("hidden_by").references(() => user.id, {
      onDelete: "set null",
    }),
  },
  (table) => [
    index("post_community_id_idx").on(table.communityId),
    index("post_author_id_idx").on(table.authorId),
    index("post_slug_community_idx").on(table.slug, table.communityId),
    index("post_status_idx").on(table.status),
  ],
);

// ── Comments ───────────────────────────────────────────────────────

export const comment = pgTable(
  "comment",
  {
    id: text("id").primaryKey(),
    content: jsonb("content").notNull(),
    postId: text("post_id")
      .notNull()
      .references(() => post.id, { onDelete: "cascade" }),
    parentCommentId: text("parent_comment_id"),
    authorId: text("author_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp("deleted_at"),
    hiddenAt: timestamp("hidden_at"),
    hiddenBy: text("hidden_by").references(() => user.id, {
      onDelete: "set null",
    }),
  },
  (table) => [
    index("comment_post_id_idx").on(table.postId),
    index("comment_author_id_idx").on(table.authorId),
    index("comment_parent_id_idx").on(table.parentCommentId),
  ],
);

// ── Reactions ──────────────────────────────────────────────────────

export const reaction = pgTable(
  "reaction",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    targetType: text("target_type", { enum: ["post", "comment"] }).notNull(),
    targetId: text("target_id").notNull(),
    reactionType: text("reaction_type", {
      enum: ["like", "love", "fire", "insightful"],
    }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    unique("reaction_user_target_type_uniq").on(
      table.userId,
      table.targetType,
      table.targetId,
      table.reactionType,
    ),
    index("reaction_target_idx").on(table.targetType, table.targetId),
    index("reaction_user_id_idx").on(table.userId),
  ],
);

// ── Flags (content reporting) ──────────────────────────────────────

export const flag = pgTable(
  "flag",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    targetType: text("target_type", { enum: ["post", "comment"] }).notNull(),
    targetId: text("target_id").notNull(),
    reason: text("reason", {
      enum: ["spam", "harassment", "off_topic", "other"],
    }).notNull(),
    description: text("description"),
    status: text("status", { enum: ["open", "resolved", "dismissed"] })
      .default("open")
      .notNull(),
    communityId: text("community_id")
      .notNull()
      .references(() => community.id, { onDelete: "cascade" }),
    resolvedAt: timestamp("resolved_at"),
    resolvedBy: text("resolved_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    unique("flag_user_target_uniq").on(
      table.userId,
      table.targetType,
      table.targetId,
    ),
    index("flag_target_idx").on(table.targetType, table.targetId),
    index("flag_community_id_idx").on(table.communityId),
    index("flag_status_idx").on(table.status),
    index("flag_user_id_idx").on(table.userId),
  ],
);

// ── Moderation Actions (audit log) ─────────────────────────────────

export const moderationAction = pgTable(
  "moderation_action",
  {
    id: text("id").primaryKey(),
    action: text("action", {
      enum: [
        "hide_post",
        "unhide_post",
        "delete_post",
        "hide_comment",
        "unhide_comment",
        "delete_comment",
        "dismiss_flags",
        "warn_member",
        "suspend_member",
        "unsuspend_member",
        "remove_member",
        "archive_community",
        "restore_community",
        "feature_community",
        "unfeature_community",
        "suspend_user_platform",
        "unsuspend_user_platform",
        "soft_delete_user_platform",
      ],
    }).notNull(),
    moderatorId: text("moderator_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    targetType: text("target_type", {
      enum: ["post", "comment", "member", "community", "user"],
    }).notNull(),
    targetId: text("target_id").notNull(),
    targetUserId: text("target_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    reason: text("reason"),
    communityId: text("community_id").references(() => community.id, {
      onDelete: "cascade",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("mod_action_community_id_idx").on(table.communityId),
    index("mod_action_moderator_id_idx").on(table.moderatorId),
    index("mod_action_target_idx").on(table.targetType, table.targetId),
    index("mod_action_created_at_idx").on(table.createdAt),
  ],
);

// ── Bookmarks ──────────────────────────────────────────────────────

export const bookmark = pgTable(
  "bookmark",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    targetType: text("target_type", { enum: ["post", "listing"] }).notNull(),
    targetId: text("target_id").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    unique("bookmark_user_target_uniq").on(
      table.userId,
      table.targetType,
      table.targetId,
    ),
    index("bookmark_user_id_idx").on(table.userId),
    index("bookmark_target_idx").on(table.targetType, table.targetId),
  ],
);

// ── Companies (lightweight, for job listing posters) ──────────────

export const company = pgTable(
  "company",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    logoUrl: text("logo_url"),
    website: text("website"),
    description: text("description"),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("company_created_by_idx").on(table.createdBy)],
);

// ── Job Listings ──────────────────────────────────────────────────

export const jobListing = pgTable(
  "job_listing",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    companyId: text("company_id")
      .notNull()
      .references(() => company.id, { onDelete: "cascade" }),
    description: text("description").notNull(),
    requirements: text("requirements"),
    location: text("location"),
    remote: boolean("remote").default(false).notNull(),
    employmentType: text("employment_type", {
      enum: ["full_time", "part_time", "freelance", "internship"],
    }).notNull(),
    salaryRange: text("salary_range"),
    applicationUrl: text("application_url").notNull(),
    postedBy: text("posted_by")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    clickCount: integer("click_count").default(0).notNull(),
    archivedAt: timestamp("archived_at"),
  },
  (table) => [
    index("job_listing_company_id_idx").on(table.companyId),
    index("job_listing_posted_by_idx").on(table.postedBy),
    index("job_listing_employment_type_idx").on(table.employmentType),
  ],
);

// ── Sister Links (cross-tree community affiliations) ──────────────

export const sisterLink = pgTable(
  "sister_link",
  {
    id: text("id").primaryKey(),
    // Canonical order: communityAId < communityBId to prevent duplicates
    communityAId: text("community_a_id")
      .notNull()
      .references(() => community.id, { onDelete: "cascade" }),
    communityBId: text("community_b_id")
      .notNull()
      .references(() => community.id, { onDelete: "cascade" }),
    status: text("status", { enum: ["pending", "active"] })
      .default("pending")
      .notNull(),
    // Which community initiated the request
    requestedCommunityId: text("requested_community_id")
      .notNull()
      .references(() => community.id, { onDelete: "cascade" }),
    requestedBy: text("requested_by")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    unique("sister_link_communities_uniq").on(
      table.communityAId,
      table.communityBId,
    ),
    index("sister_link_a_idx").on(table.communityAId),
    index("sister_link_b_idx").on(table.communityBId),
    index("sister_link_status_idx").on(table.status),
  ],
);
