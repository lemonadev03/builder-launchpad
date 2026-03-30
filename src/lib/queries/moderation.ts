import { and, eq, desc, inArray, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { post, comment, flag, moderationAction, profile } from "@/db/schema";
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
  | "unfeature_community";

export async function logModerationAction(data: {
  action: ModerationActionType;
  moderatorId: string;
  targetType: "post" | "comment" | "member" | "community";
  targetId: string;
  targetUserId?: string;
  reason?: string;
  communityId: string;
}) {
  const [created] = await db
    .insert(moderationAction)
    .values({
      id: crypto.randomUUID(),
      ...data,
      targetUserId: data.targetUserId ?? null,
      reason: data.reason ?? null,
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
