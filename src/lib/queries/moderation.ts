import { and, eq, desc, inArray, gte, lte } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { community, post, comment, flag, moderationAction, profile } from "@/db/schema";
import { count as drizzleCount } from "drizzle-orm";

type ModerationActionType =
  | "hide_post"
  | "unhide_post"
  | "delete_post"
  | "hide_comment"
  | "unhide_comment"
  | "delete_comment"
  | "dismiss_flags"
  | "warn_member"
  | "suspend_member"
  | "unsuspend_member"
  | "remove_member"
  | "archive_community"
  | "restore_community"
  | "feature_community"
  | "unfeature_community"
  | "warn_user_platform"
  | "suspend_user_platform"
  | "unsuspend_user_platform"
  | "soft_delete_user_platform";

export const PLATFORM_MODERATION_ACTIONS = [
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
  "warn_user_platform",
  "suspend_user_platform",
  "unsuspend_user_platform",
  "soft_delete_user_platform",
] as const;

export async function logModerationAction(data: {
  action: ModerationActionType;
  moderatorId: string;
  targetType: "post" | "comment" | "member" | "community" | "user";
  targetId: string;
  targetUserId?: string;
  reason?: string;
  communityId?: string | null;
}) {
  const [created] = await db
    .insert(moderationAction)
    .values({
      id: crypto.randomUUID(),
      ...data,
      targetUserId: data.targetUserId ?? null,
      reason: data.reason ?? null,
      communityId: data.communityId ?? null,
    })
    .returning();

  return created;
}

export async function hidePost(postId: string, moderatorId: string) {
  const [updated] = await db
    .update(post)
    .set({ hiddenAt: new Date(), hiddenBy: moderatorId })
    .where(eq(post.id, postId))
    .returning();

  return updated ?? null;
}

export async function unhidePost(postId: string) {
  const [updated] = await db
    .update(post)
    .set({ hiddenAt: null, hiddenBy: null })
    .where(eq(post.id, postId))
    .returning();

  return updated ?? null;
}

export async function hideComment(commentId: string, moderatorId: string) {
  const [updated] = await db
    .update(comment)
    .set({ hiddenAt: new Date(), hiddenBy: moderatorId })
    .where(eq(comment.id, commentId))
    .returning();

  return updated ?? null;
}

export async function unhideComment(commentId: string) {
  const [updated] = await db
    .update(comment)
    .set({ hiddenAt: null, hiddenBy: null })
    .where(eq(comment.id, commentId))
    .returning();

  return updated ?? null;
}

export async function dismissFlags(
  targetType: "post" | "comment",
  targetId: string,
  moderatorId: string,
) {
  await db
    .update(flag)
    .set({ status: "dismissed", resolvedAt: new Date(), resolvedBy: moderatorId })
    .where(
      and(
        eq(flag.targetType, targetType),
        eq(flag.targetId, targetId),
        eq(flag.status, "open"),
      ),
    );
}

export async function resolveFlags(
  targetType: "post" | "comment",
  targetId: string,
  moderatorId: string,
) {
  await db
    .update(flag)
    .set({ status: "resolved", resolvedAt: new Date(), resolvedBy: moderatorId })
    .where(
      and(
        eq(flag.targetType, targetType),
        eq(flag.targetId, targetId),
        eq(flag.status, "open"),
      ),
    );
}

export async function getModerationLog(
  communityIds: string[],
  opts: {
    limit: number;
    offset: number;
    action?: string;
    moderatorId?: string;
    dateFrom?: Date;
    dateTo?: Date;
  },
) {
  if (communityIds.length === 0) return { actions: [], total: 0 };

  const conditions = [inArray(moderationAction.communityId, communityIds)];

  if (opts.action) {
    conditions.push(eq(moderationAction.action, opts.action as typeof moderationAction.action.enumValues[number]));
  }
  if (opts.moderatorId) {
    conditions.push(eq(moderationAction.moderatorId, opts.moderatorId));
  }
  if (opts.dateFrom) {
    conditions.push(gte(moderationAction.createdAt, opts.dateFrom));
  }
  if (opts.dateTo) {
    conditions.push(lte(moderationAction.createdAt, opts.dateTo));
  }

  const where = and(...conditions);

  const actions = await db
    .select({
      id: moderationAction.id,
      action: moderationAction.action,
      targetType: moderationAction.targetType,
      targetId: moderationAction.targetId,
      reason: moderationAction.reason,
      createdAt: moderationAction.createdAt,
      moderatorDisplayName: profile.displayName,
      moderatorUsername: profile.username,
    })
    .from(moderationAction)
    .innerJoin(profile, eq(moderationAction.moderatorId, profile.userId))
    .where(where)
    .orderBy(desc(moderationAction.createdAt))
    .limit(opts.limit)
    .offset(opts.offset);

  const [totalRow] = await db
    .select({ count: drizzleCount() })
    .from(moderationAction)
    .where(where);

  return { actions, total: totalRow?.count ?? 0 };
}

export async function getModeratorList(communityIds: string[]) {
  if (communityIds.length === 0) return [];

  const rows = await db
    .selectDistinct({
      moderatorId: moderationAction.moderatorId,
      displayName: profile.displayName,
      username: profile.username,
    })
    .from(moderationAction)
    .innerJoin(profile, eq(moderationAction.moderatorId, profile.userId))
    .where(inArray(moderationAction.communityId, communityIds));

  return rows;
}

export async function getPlatformModerationLog(opts: {
  limit: number;
  offset: number;
  action?: string;
  moderatorId?: string;
  communityId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}) {
  const moderatorProfile = alias(profile, "moderator_profile");
  const targetProfile = alias(profile, "target_profile");
  const actionCommunity = alias(community, "action_community");

  const conditions = [
    inArray(
      moderationAction.action,
      [...PLATFORM_MODERATION_ACTIONS] as Array<
        typeof moderationAction.action.enumValues[number]
      >,
    ),
  ];

  if (opts.action) {
    conditions.push(
      eq(
        moderationAction.action,
        opts.action as typeof moderationAction.action.enumValues[number],
      ),
    );
  }
  if (opts.moderatorId) {
    conditions.push(eq(moderationAction.moderatorId, opts.moderatorId));
  }
  if (opts.communityId) {
    conditions.push(eq(moderationAction.communityId, opts.communityId));
  }
  if (opts.dateFrom) {
    conditions.push(gte(moderationAction.createdAt, opts.dateFrom));
  }
  if (opts.dateTo) {
    conditions.push(lte(moderationAction.createdAt, opts.dateTo));
  }

  const where = and(...conditions);

  const actions = await db
    .select({
      id: moderationAction.id,
      action: moderationAction.action,
      targetType: moderationAction.targetType,
      targetId: moderationAction.targetId,
      reason: moderationAction.reason,
      createdAt: moderationAction.createdAt,
      communityId: moderationAction.communityId,
      communityName: actionCommunity.name,
      moderatorId: moderationAction.moderatorId,
      moderatorDisplayName: moderatorProfile.displayName,
      moderatorUsername: moderatorProfile.username,
      targetUserId: moderationAction.targetUserId,
      targetDisplayName: targetProfile.displayName,
      targetUsername: targetProfile.username,
    })
    .from(moderationAction)
    .innerJoin(
      moderatorProfile,
      eq(moderationAction.moderatorId, moderatorProfile.userId),
    )
    .leftJoin(actionCommunity, eq(moderationAction.communityId, actionCommunity.id))
    .leftJoin(targetProfile, eq(moderationAction.targetUserId, targetProfile.userId))
    .where(where)
    .orderBy(desc(moderationAction.createdAt))
    .limit(opts.limit)
    .offset(opts.offset);

  const [totalRow] = await db
    .select({ count: drizzleCount() })
    .from(moderationAction)
    .where(where);

  return { actions, total: totalRow?.count ?? 0 };
}

export async function getPlatformModerators(opts?: { communityId?: string }) {
  const moderatorProfile = alias(profile, "moderator_profile");
  const conditions = [
    inArray(
      moderationAction.action,
      [...PLATFORM_MODERATION_ACTIONS] as Array<
        typeof moderationAction.action.enumValues[number]
      >,
    ),
  ];

  if (opts?.communityId) {
    conditions.push(eq(moderationAction.communityId, opts.communityId));
  }

  return db
    .selectDistinct({
      moderatorId: moderationAction.moderatorId,
      displayName: moderatorProfile.displayName,
      username: moderatorProfile.username,
    })
    .from(moderationAction)
    .innerJoin(
      moderatorProfile,
      eq(moderationAction.moderatorId, moderatorProfile.userId),
    )
    .where(and(...conditions));
}

export async function getPlatformModerationCommunities() {
  const actionCommunity = alias(community, "action_community");

  return db
    .selectDistinct({
      id: actionCommunity.id,
      name: actionCommunity.name,
      slug: actionCommunity.slug,
    })
    .from(moderationAction)
    .innerJoin(actionCommunity, eq(moderationAction.communityId, actionCommunity.id))
    .where(
      inArray(
        moderationAction.action,
        [...PLATFORM_MODERATION_ACTIONS] as Array<
          typeof moderationAction.action.enumValues[number]
        >,
      ),
    );
}
