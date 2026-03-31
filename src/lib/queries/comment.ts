import {
  and,
  eq,
  isNull,
  desc,
  asc,
  count as drizzleCount,
  sql,
} from "drizzle-orm";
import { db } from "@/db";
import { comment, profile, membership } from "@/db/schema";
import type { CreateCommentInput } from "@/lib/validations/comment";

export async function createComment(
  userId: string,
  postId: string,
  data: CreateCommentInput,
) {
  const [created] = await db
    .insert(comment)
    .values({
      id: crypto.randomUUID(),
      content: data.content,
      postId,
      parentCommentId: data.parentCommentId ?? null,
      authorId: userId,
    })
    .returning();

  return created;
}

export async function getCommentById(commentId: string) {
  const rows = await db
    .select({
      id: comment.id,
      content: comment.content,
      postId: comment.postId,
      parentCommentId: comment.parentCommentId,
      authorId: comment.authorId,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      deletedAt: comment.deletedAt,
    })
    .from(comment)
    .where(eq(comment.id, commentId))
    .limit(1);

  return rows[0] ?? null;
}

export async function updateComment(commentId: string, content: unknown) {
  const [updated] = await db
    .update(comment)
    .set({ content })
    .where(and(eq(comment.id, commentId), isNull(comment.deletedAt)))
    .returning();

  return updated ?? null;
}

export async function softDeleteComment(commentId: string) {
  const [deleted] = await db
    .update(comment)
    .set({ deletedAt: new Date() })
    .where(and(eq(comment.id, commentId), isNull(comment.deletedAt)))
    .returning();

  return deleted ?? null;
}

export async function getCommentsByPost(
  postId: string,
  opts: { limit: number; offset: number; sort: "newest" | "oldest" },
) {
  const orderDir = opts.sort === "newest" ? desc : asc;

  const topLevel = await db
    .select({
      id: comment.id,
      content: comment.content,
      postId: comment.postId,
      parentCommentId: comment.parentCommentId,
      authorId: comment.authorId,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      deletedAt: comment.deletedAt,
      hiddenAt: comment.hiddenAt,
      authorDisplayName: profile.displayName,
      authorUsername: profile.username,
      authorAvatarUrl: profile.avatarUrl,
    })
    .from(comment)
    .innerJoin(profile, eq(comment.authorId, profile.userId))
    .where(
      and(eq(comment.postId, postId), isNull(comment.parentCommentId)),
    )
    .orderBy(orderDir(comment.createdAt))
    .limit(opts.limit)
    .offset(opts.offset);

  if (topLevel.length === 0) return { comments: [], total: 0 };

  const [totalRow] = await db
    .select({ count: drizzleCount() })
    .from(comment)
    .where(
      and(eq(comment.postId, postId), isNull(comment.parentCommentId)),
    );

  // Batch-fetch replies for these top-level comments
  const topIds = topLevel.map((c) => c.id);
  const replies = await db
    .select({
      id: comment.id,
      content: comment.content,
      postId: comment.postId,
      parentCommentId: comment.parentCommentId,
      authorId: comment.authorId,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      deletedAt: comment.deletedAt,
      hiddenAt: comment.hiddenAt,
      authorDisplayName: profile.displayName,
      authorUsername: profile.username,
      authorAvatarUrl: profile.avatarUrl,
    })
    .from(comment)
    .innerJoin(profile, eq(comment.authorId, profile.userId))
    .where(
      sql`${comment.parentCommentId} IN (${sql.join(
        topIds.map((id) => sql`${id}`),
        sql`, `,
      )})`,
    )
    .orderBy(asc(comment.createdAt));

  const replyMap = new Map<string, typeof replies>();
  for (const r of replies) {
    const list = replyMap.get(r.parentCommentId!) ?? [];
    list.push(r);
    replyMap.set(r.parentCommentId!, list);
  }

  const comments = topLevel.map((c) => ({
    ...c,
    replies: replyMap.get(c.id) ?? [],
    replyCount: (replyMap.get(c.id) ?? []).length,
  }));

  return { comments, total: totalRow?.count ?? 0 };
}

export async function getCommentCountByPost(postId: string): Promise<number> {
  const [row] = await db
    .select({ count: drizzleCount() })
    .from(comment)
    .where(and(eq(comment.postId, postId), isNull(comment.deletedAt)));

  return row?.count ?? 0;
}

export async function getCommentCountsBatch(
  postIds: string[],
): Promise<Map<string, number>> {
  if (postIds.length === 0) return new Map();

  const rows = await db
    .select({
      postId: comment.postId,
      count: drizzleCount(),
    })
    .from(comment)
    .where(
      and(
        sql`${comment.postId} IN (${sql.join(
          postIds.map((id) => sql`${id}`),
          sql`, `,
        )})`,
        isNull(comment.deletedAt),
      ),
    )
    .groupBy(comment.postId);

  const map = new Map<string, number>();
  for (const row of rows) {
    map.set(row.postId, row.count);
  }
  return map;
}

export async function getCommentCountTodayByUser(
  userId: string,
): Promise<number> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [row] = await db
    .select({ count: drizzleCount() })
    .from(comment)
    .where(
      and(
        eq(comment.authorId, userId),
        isNull(comment.deletedAt),
        sql`${comment.createdAt} >= ${startOfDay.toISOString()}`,
      ),
    );

  return row?.count ?? 0;
}

export async function getAuthorRolesBatch(
  communityId: string,
  userIds: string[],
): Promise<Map<string, string>> {
  if (userIds.length === 0) return new Map();

  const rows = await db
    .select({
      userId: membership.userId,
      role: membership.role,
    })
    .from(membership)
    .where(
      and(
        eq(membership.communityId, communityId),
        eq(membership.status, "active"),
        sql`${membership.userId} IN (${sql.join(
          userIds.map((id) => sql`${id}`),
          sql`, `,
        )})`,
      ),
    );

  const map = new Map<string, string>();
  for (const row of rows) {
    map.set(row.userId, row.role);
  }
  return map;
}
