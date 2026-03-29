import { and, desc, eq, gte, isNull, sql, count as drizzleCount } from "drizzle-orm";
import { db } from "@/db";
import { post, community, profile, membership } from "@/db/schema";
import { findAvailablePostSlug } from "@/lib/slug";
import { extractPlainText } from "@/lib/tiptap";
import type { TiptapContent } from "@/lib/tiptap";
import type { CreatePostInput, UpdatePostInput } from "@/lib/validations/post";

export async function createPost(userId: string, data: CreatePostInput) {
  const slug = await findAvailablePostSlug(data.title, data.communityId);
  const content = data.content as TiptapContent;
  const excerpt = extractPlainText(content);

  const [created] = await db
    .insert(post)
    .values({
      id: crypto.randomUUID(),
      title: data.title,
      slug,
      content: data.content,
      excerpt,
      tags: data.tags ?? [],
      communityId: data.communityId,
      authorId: userId,
      status: data.status,
      publishedAt: data.status === "published" ? new Date() : null,
    })
    .returning();

  return created;
}

export async function getPostBySlug(communitySlug: string, postSlug: string) {
  const rows = await db
    .select({
      id: post.id,
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt,
      tags: post.tags,
      status: post.status,
      publishedAt: post.publishedAt,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      authorId: post.authorId,
      communityId: post.communityId,
      communityName: community.name,
      communitySlug: community.slug,
      authorDisplayName: profile.displayName,
      authorUsername: profile.username,
      authorAvatarUrl: profile.avatarUrl,
      hiddenAt: post.hiddenAt,
    })
    .from(post)
    .innerJoin(community, eq(post.communityId, community.id))
    .innerJoin(profile, eq(post.authorId, profile.userId))
    .where(
      and(
        eq(post.slug, postSlug.toLowerCase()),
        eq(community.slug, communitySlug.toLowerCase()),
        isNull(post.archivedAt),
      ),
    )
    .limit(1);

  if (!rows[0]) return null;

  // Get author's role in this community
  const memRows = await db
    .select({ role: membership.role })
    .from(membership)
    .where(
      and(
        eq(membership.userId, rows[0].authorId),
        eq(membership.communityId, rows[0].communityId),
        eq(membership.status, "active"),
      ),
    )
    .limit(1);

  return {
    ...rows[0],
    authorRole: memRows[0]?.role ?? null,
  };
}

export async function getPostById(postId: string) {
  const rows = await db
    .select({
      id: post.id,
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt,
      tags: post.tags,
      status: post.status,
      communityId: post.communityId,
      authorId: post.authorId,
      publishedAt: post.publishedAt,
      createdAt: post.createdAt,
      communityName: community.name,
      communitySlug: community.slug,
    })
    .from(post)
    .innerJoin(community, eq(post.communityId, community.id))
    .where(and(eq(post.id, postId), isNull(post.archivedAt)))
    .limit(1);

  return rows[0] ?? null;
}

export async function updatePost(postId: string, data: UpdatePostInput) {
  const updates: Record<string, unknown> = {};

  if (data.title !== undefined) updates.title = data.title;
  if (data.tags !== undefined) updates.tags = data.tags;
  if (data.content !== undefined) {
    updates.content = data.content;
    updates.excerpt = extractPlainText(data.content as TiptapContent);
  }
  if (data.status !== undefined) {
    updates.status = data.status;
    if (data.status === "published") {
      // Only set publishedAt on first publish
      const existing = await db
        .select({ publishedAt: post.publishedAt })
        .from(post)
        .where(eq(post.id, postId))
        .limit(1);
      if (!existing[0]?.publishedAt) {
        updates.publishedAt = new Date();
      }
    }
  }

  if (Object.keys(updates).length === 0) return null;

  const [updated] = await db
    .update(post)
    .set(updates)
    .where(and(eq(post.id, postId), isNull(post.archivedAt)))
    .returning();

  return updated ?? null;
}

export async function archivePost(postId: string) {
  const [archived] = await db
    .update(post)
    .set({ archivedAt: new Date() })
    .where(and(eq(post.id, postId), isNull(post.archivedAt)))
    .returning();

  return archived ?? null;
}

export async function getPublishedPostsByCommunity(
  communityId: string,
  opts: { limit: number; offset: number; tag?: string },
) {
  const baseConditions = [
    eq(post.communityId, communityId),
    eq(post.status, "published"),
    isNull(post.archivedAt),
    isNull(post.hiddenAt),
  ];

  if (opts.tag) {
    baseConditions.push(
      sql`${post.tags} @> ${JSON.stringify([opts.tag])}::jsonb`,
    );
  }

  const whereClause = and(...baseConditions);

  const [posts, totalRows] = await Promise.all([
    db
      .select({
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        tags: post.tags,
        publishedAt: post.publishedAt,
        authorDisplayName: profile.displayName,
        authorUsername: profile.username,
        authorAvatarUrl: profile.avatarUrl,
      })
      .from(post)
      .innerJoin(profile, eq(post.authorId, profile.userId))
      .where(whereClause)
      .orderBy(desc(post.publishedAt))
      .limit(opts.limit)
      .offset(opts.offset),
    db
      .select({ count: drizzleCount() })
      .from(post)
      .where(whereClause),
  ]);

  return { posts, total: totalRows[0]?.count ?? 0 };
}

export async function getTagsByCommunity(communityId: string) {
  const rows = await db.execute(
    sql`SELECT t.tag, COUNT(*)::int as count
        FROM ${post}, jsonb_array_elements_text(${post.tags}) AS t(tag)
        WHERE ${post.communityId} = ${communityId}
          AND ${post.status} = 'published'
          AND ${post.archivedAt} IS NULL
          AND ${post.hiddenAt} IS NULL
        GROUP BY t.tag
        ORDER BY count DESC`,
  );

  return rows as unknown as Array<{ tag: string; count: number }>;
}

export async function getRecentPostsByCommunity(
  communityId: string,
  limit = 3,
) {
  return db
    .select({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      tags: post.tags,
      publishedAt: post.publishedAt,
      authorDisplayName: profile.displayName,
      authorUsername: profile.username,
      authorAvatarUrl: profile.avatarUrl,
    })
    .from(post)
    .innerJoin(profile, eq(post.authorId, profile.userId))
    .where(
      and(
        eq(post.communityId, communityId),
        eq(post.status, "published"),
        isNull(post.archivedAt),
        isNull(post.hiddenAt),
      ),
    )
    .orderBy(desc(post.publishedAt))
    .limit(limit);
}

export async function getDraftsByUser(userId: string) {
  return db
    .select({
      id: post.id,
      title: post.title,
      slug: post.slug,
      updatedAt: post.updatedAt,
      communityName: community.name,
      communitySlug: community.slug,
    })
    .from(post)
    .innerJoin(community, eq(post.communityId, community.id))
    .where(
      and(
        eq(post.authorId, userId),
        eq(post.status, "draft"),
        isNull(post.archivedAt),
      ),
    )
    .orderBy(desc(post.updatedAt));
}

export async function getDraftCountByUser(userId: string): Promise<number> {
  const rows = await db
    .select({ count: drizzleCount() })
    .from(post)
    .where(
      and(
        eq(post.authorId, userId),
        eq(post.status, "draft"),
        isNull(post.archivedAt),
      ),
    );

  return rows[0]?.count ?? 0;
}

export async function getPostCountTodayByUser(
  userId: string,
): Promise<number> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const rows = await db
    .select({ count: drizzleCount() })
    .from(post)
    .where(
      and(
        eq(post.authorId, userId),
        isNull(post.archivedAt),
        gte(post.createdAt, startOfDay),
      ),
    );

  return rows[0]?.count ?? 0;
}
