import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { post, comment, flag, moderationAction } from "@/db/schema";

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
  | "remove_member";

export async function logModerationAction(data: {
  action: ModerationActionType;
  moderatorId: string;
  targetType: "post" | "comment" | "member";
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
