import { and, eq, desc, count as drizzleCount } from "drizzle-orm";
import { db } from "@/db";
import { bookmark, post, community, profile, jobListing, company } from "@/db/schema";

export async function addBookmark(
  userId: string,
  targetType: "post" | "listing",
  targetId: string,
) {
  const [created] = await db
    .insert(bookmark)
    .values({
      id: crypto.randomUUID(),
      userId,
      targetType,
      targetId,
    })
    .onConflictDoNothing()
    .returning();

  return created ?? null;
}

export async function removeBookmark(
  userId: string,
  targetType: "post" | "listing",
  targetId: string,
) {
  const [deleted] = await db
    .delete(bookmark)
    .where(
      and(
        eq(bookmark.userId, userId),
        eq(bookmark.targetType, targetType),
        eq(bookmark.targetId, targetId),
      ),
    )
    .returning();

  return deleted ?? null;
}

export async function isBookmarked(
  userId: string,
  targetType: "post" | "listing",
  targetId: string,
): Promise<boolean> {
  const rows = await db
    .select({ id: bookmark.id })
    .from(bookmark)
    .where(
      and(
        eq(bookmark.userId, userId),
        eq(bookmark.targetType, targetType),
        eq(bookmark.targetId, targetId),
      ),
    )
    .limit(1);

  return rows.length > 0;
}

export async function getUserPostBookmarks(
  userId: string,
  opts: { limit: number; offset: number },
) {
  const where = and(
    eq(bookmark.userId, userId),
    eq(bookmark.targetType, "post"),
  );

  const bookmarks = await db
    .select({
      bookmarkId: bookmark.id,
      bookmarkCreatedAt: bookmark.createdAt,
      targetType: bookmark.targetType,
      targetId: bookmark.targetId,
      postTitle: post.title,
      postSlug: post.slug,
      postExcerpt: post.excerpt,
      postTags: post.tags,
      postPublishedAt: post.publishedAt,
      communityName: community.name,
      communitySlug: community.slug,
      authorDisplayName: profile.displayName,
      authorUsername: profile.username,
      authorAvatarUrl: profile.avatarUrl,
    })
    .from(bookmark)
    .innerJoin(post, eq(bookmark.targetId, post.id))
    .innerJoin(community, eq(post.communityId, community.id))
    .innerJoin(profile, eq(post.authorId, profile.userId))
    .where(where)
    .orderBy(desc(bookmark.createdAt))
    .limit(opts.limit)
    .offset(opts.offset);

  const [totalRow] = await db
    .select({ count: drizzleCount() })
    .from(bookmark)
    .where(where);

  return { bookmarks, total: totalRow?.count ?? 0 };
}

export async function getUserListingBookmarks(
  userId: string,
  opts: { limit: number; offset: number },
) {
  const where = and(
    eq(bookmark.userId, userId),
    eq(bookmark.targetType, "listing"),
  );

  const bookmarks = await db
    .select({
      bookmarkId: bookmark.id,
      bookmarkCreatedAt: bookmark.createdAt,
      targetType: bookmark.targetType,
      targetId: bookmark.targetId,
      jobId: jobListing.id,
      jobTitle: jobListing.title,
      jobDescription: jobListing.description,
      jobLocation: jobListing.location,
      jobRemote: jobListing.remote,
      jobEmploymentType: jobListing.employmentType,
      jobSalaryRange: jobListing.salaryRange,
      jobApplicationUrl: jobListing.applicationUrl,
      jobCreatedAt: jobListing.createdAt,
      companyName: company.name,
      companyLogoUrl: company.logoUrl,
    })
    .from(bookmark)
    .innerJoin(jobListing, eq(bookmark.targetId, jobListing.id))
    .innerJoin(company, eq(jobListing.companyId, company.id))
    .where(where)
    .orderBy(desc(bookmark.createdAt))
    .limit(opts.limit)
    .offset(opts.offset);

  const [totalRow] = await db
    .select({ count: drizzleCount() })
    .from(bookmark)
    .where(where);

  return { bookmarks, total: totalRow?.count ?? 0 };
}

// Keep for backward compat — returns all bookmarks count
export async function getUserBookmarkCount(userId: string): Promise<number> {
  const [row] = await db
    .select({ count: drizzleCount() })
    .from(bookmark)
    .where(eq(bookmark.userId, userId));

  return row?.count ?? 0;
}
