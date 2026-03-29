import { and, eq, isNull, desc, lt, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { post, profile, membership, community } from "@/db/schema";

export type FeedCursor = { publishedAt: string; id: string };

export async function getPersonalFeed(
  userId: string,
  opts: { limit: number; cursor?: FeedCursor; communityId?: string },
) {
  const limit = Math.min(50, Math.max(1, opts.limit));

  // Subquery: community IDs where user has active membership
  const userCommunityIds = db
    .select({ communityId: membership.communityId })
    .from(membership)
    .where(
      and(
        eq(membership.userId, userId),
        eq(membership.status, "active"),
      ),
    );

  const conditions = [
    sql`${post.communityId} IN (${userCommunityIds})`,
    eq(post.status, "published"),
    isNull(post.archivedAt),
  ];

  // Optional community filter
  if (opts.communityId) {
    conditions.push(eq(post.communityId, opts.communityId));
  }

  // Compound cursor: (publishedAt, id) for stable pagination
  if (opts.cursor) {
    const cursorDate = new Date(opts.cursor.publishedAt);
    conditions.push(
      or(
        lt(post.publishedAt, cursorDate),
        and(
          eq(post.publishedAt, cursorDate),
          lt(post.id, opts.cursor.id),
        ),
      )!,
    );
  }

  const whereClause = and(...conditions);

  const posts = await db
    .select({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      tags: post.tags,
      publishedAt: post.publishedAt,
      communityId: post.communityId,
      communityName: community.name,
      communitySlug: community.slug,
      authorDisplayName: profile.displayName,
      authorUsername: profile.username,
      authorAvatarUrl: profile.avatarUrl,
    })
    .from(post)
    .innerJoin(profile, eq(post.authorId, profile.userId))
    .innerJoin(community, eq(post.communityId, community.id))
    .where(whereClause)
    .orderBy(desc(post.publishedAt), desc(post.id))
    .limit(limit + 1); // fetch one extra to determine hasMore

  const hasMore = posts.length > limit;
  const page = hasMore ? posts.slice(0, limit) : posts;

  const nextCursor: FeedCursor | null =
    hasMore && page.length > 0
      ? {
          publishedAt: page[page.length - 1].publishedAt!.toISOString(),
          id: page[page.length - 1].id,
        }
      : null;

  return { posts: page, nextCursor };
}
