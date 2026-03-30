import { and, eq, desc, count as drizzleCount, gte, inArray } from "drizzle-orm";
import { db } from "@/db";
import { flag, post, comment, profile, community } from "@/db/schema";

export async function createFlag(
  userId: string,
  targetType: "post" | "comment",
  targetId: string,
  reason: "spam" | "harassment" | "off_topic" | "other",
  communityId: string,
  description?: string,
) {
  const [created] = await db
    .insert(flag)
    .values({
      id: crypto.randomUUID(),
      userId,
      targetType,
      targetId,
      reason,
      communityId,
      description: description || null,
    })
    .onConflictDoNothing()
    .returning();

  return created ?? null;
}

export async function hasUserFlagged(
  userId: string,
  targetType: "post" | "comment",
  targetId: string,
): Promise<boolean> {
  const rows = await db
    .select({ id: flag.id })
    .from(flag)
    .where(
      and(
        eq(flag.userId, userId),
        eq(flag.targetType, targetType),
        eq(flag.targetId, targetId),
      ),
    )
    .limit(1);

  return rows.length > 0;
}

export async function getFlagCount(
  targetType: "post" | "comment",
  targetId: string,
): Promise<number> {
  const [row] = await db
    .select({ count: drizzleCount() })
    .from(flag)
    .where(
      and(
        eq(flag.targetType, targetType),
        eq(flag.targetId, targetId),
        eq(flag.status, "open"),
      ),
    );

  return row?.count ?? 0;
}

export async function getFlagCountsBatch(
  targetType: "post" | "comment",
  targetIds: string[],
): Promise<Map<string, number>> {
  if (targetIds.length === 0) return new Map();

  const rows = await db
    .select({
      targetId: flag.targetId,
      count: drizzleCount(),
    })
    .from(flag)
    .where(
      and(
        eq(flag.targetType, targetType),
        eq(flag.status, "open"),
        inArray(flag.targetId, targetIds),
      ),
    )
    .groupBy(flag.targetId);

  const map = new Map<string, number>();
  for (const row of rows) {
    map.set(row.targetId, row.count);
  }
  return map;
}

export async function getUserFlaggedTargets(
  userId: string,
  targetType: "post" | "comment",
  targetIds: string[],
): Promise<Set<string>> {
  if (targetIds.length === 0) return new Set();

  const rows = await db
    .select({ targetId: flag.targetId })
    .from(flag)
    .where(
      and(
        eq(flag.userId, userId),
        eq(flag.targetType, targetType),
        inArray(flag.targetId, targetIds),
      ),
    );

  return new Set(rows.map((r) => r.targetId));
}

export async function getUserDailyFlagCount(userId: string): Promise<number> {
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [row] = await db
    .select({ count: drizzleCount() })
    .from(flag)
    .where(and(eq(flag.userId, userId), gte(flag.createdAt, dayAgo)));

  return row?.count ?? 0;
}

export async function getFlagsByCommunity(
  communityIds: string[],
  opts: {
    status?: "open" | "resolved" | "dismissed";
    limit: number;
    offset: number;
  },
) {
  if (communityIds.length === 0) return { flags: [], total: 0 };

  const conditions = [inArray(flag.communityId, communityIds)];
  if (opts.status) {
    conditions.push(eq(flag.status, opts.status));
  }

  const where = and(...conditions);

  const flags = await db
    .select({
      id: flag.id,
      targetType: flag.targetType,
      targetId: flag.targetId,
      reason: flag.reason,
      description: flag.description,
      status: flag.status,
      communityId: flag.communityId,
      createdAt: flag.createdAt,
      resolvedAt: flag.resolvedAt,
      reporterDisplayName: profile.displayName,
      reporterUsername: profile.username,
      reporterAvatarUrl: profile.avatarUrl,
      communityName: community.name,
      communitySlug: community.slug,
    })
    .from(flag)
    .innerJoin(profile, eq(flag.userId, profile.userId))
    .innerJoin(community, eq(flag.communityId, community.id))
    .where(where)
    .orderBy(desc(flag.createdAt))
    .limit(opts.limit)
    .offset(opts.offset);

  const [totalRow] = await db
    .select({ count: drizzleCount() })
    .from(flag)
    .where(where);

  return { flags, total: totalRow?.count ?? 0 };
}

export async function getOpenFlagCount(communityIds: string[]): Promise<number> {
  if (communityIds.length === 0) return 0;

  const [row] = await db
    .select({ count: drizzleCount() })
    .from(flag)
    .where(
      and(inArray(flag.communityId, communityIds), eq(flag.status, "open")),
    );

  return row?.count ?? 0;
}

export async function getFlaggedPostPreviewsBatch(postIds: string[]) {
  if (postIds.length === 0) return new Map<string, { id: string; title: string; slug: string; excerpt: string | null; communitySlug: string; authorDisplayName: string }>();

  const rows = await db
    .select({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      communitySlug: community.slug,
      authorDisplayName: profile.displayName,
    })
    .from(post)
    .innerJoin(community, eq(post.communityId, community.id))
    .innerJoin(profile, eq(post.authorId, profile.userId))
    .where(inArray(post.id, postIds));

  const map = new Map<string, (typeof rows)[0]>();
  for (const row of rows) {
    map.set(row.id, row);
  }
  return map;
}

export async function getFlaggedCommentPreviewsBatch(commentIds: string[]) {
  if (commentIds.length === 0) return new Map<string, { id: string; content: unknown; postSlug: string; postTitle: string; communitySlug: string; authorDisplayName: string }>();

  const rows = await db
    .select({
      id: comment.id,
      content: comment.content,
      postSlug: post.slug,
      postTitle: post.title,
      communitySlug: community.slug,
      authorDisplayName: profile.displayName,
    })
    .from(comment)
    .innerJoin(post, eq(comment.postId, post.id))
    .innerJoin(community, eq(post.communityId, community.id))
    .innerJoin(profile, eq(comment.authorId, profile.userId))
    .where(inArray(comment.id, commentIds));

  const map = new Map<string, (typeof rows)[0]>();
  for (const row of rows) {
    map.set(row.id, row);
  }
  return map;
}
