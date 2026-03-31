import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  isNotNull,
  isNull,
  sql,
} from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { community, membership, post, profile } from "@/db/schema";
import { findAvailableSlug } from "@/lib/slug";
import type { CreateCommunityInput, UpdateCommunityInput } from "@/lib/validations/community";

// ── Directory types ─────────────────────────────────────────────────

export type DirectoryCommunity = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  tagline: string | null;
  location: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  primaryColor: string | null;
  joinPolicy: "invite_only" | "request_to_join" | "open";
  memberCount: number;
  chapterCount: number;
  createdAt: Date;
};

export type PlatformCommunityListItem = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  parentName: string | null;
  depth: number;
  isFeatured: boolean;
  createdAt: Date;
  archivedAt: Date | null;
  memberCount: number;
};

export type PlatformCommunityDetail = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  tagline: string | null;
  location: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  primaryColor: string | null;
  visibility: "listed" | "unlisted";
  joinPolicy: "invite_only" | "request_to_join" | "open";
  parentId: string | null;
  parentName: string | null;
  depth: number;
  subTierLabel: string | null;
  isFeatured: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
  memberCount: number;
  contentCount: number;
  childCount: number;
};

export async function createCommunity(
  userId: string,
  data: CreateCommunityInput,
  parentDepth?: number,
) {
  const slug = data.slug || (await findAvailableSlug(data.name));
  const communityId = crypto.randomUUID();
  const membershipId = crypto.randomUUID();
  if (data.parentId && parentDepth === undefined) {
    throw new Error("parentDepth required when creating a sub-community");
  }
  const depth = data.parentId ? (parentDepth ?? 0) + 1 : 0;

  return db.transaction(async (tx) => {
    const [created] = await tx
      .insert(community)
      .values({
        id: communityId,
        name: data.name,
        slug,
        description: data.description || null,
        tagline: data.tagline || null,
        location: data.location || null,
        parentId: data.parentId || null,
        depth,
        createdBy: userId,
      })
      .returning();

    await tx.insert(membership).values({
      id: membershipId,
      userId,
      communityId: created.id,
      role: "admin",
      status: "active",
    });

    return created;
  });
}

export async function getCommunityBySlug(slug: string) {
  const rows = await db
    .select()
    .from(community)
    .where(
      and(eq(community.slug, slug.toLowerCase()), isNull(community.archivedAt)),
    )
    .limit(1);

  if (rows.length === 0) return null;

  const c = rows[0];

  const [memberCount] = await db
    .select({ count: count() })
    .from(membership)
    .where(
      and(
        eq(membership.communityId, c.id),
        eq(membership.status, "active"),
      ),
    );

  return { ...c, memberCount: memberCount.count };
}

export async function getCommunityById(
  communityId: string,
  opts?: { includeArchived?: boolean },
) {
  const conditions = [eq(community.id, communityId)];
  if (!opts?.includeArchived) {
    conditions.push(isNull(community.archivedAt));
  }

  const rows = await db
    .select()
    .from(community)
    .where(and(...conditions))
    .limit(1);

  return rows[0] ?? null;
}

export async function updateCommunity(
  communityId: string,
  data: UpdateCommunityInput,
) {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === "") {
      cleaned[key] = null;
    } else if (value !== undefined) {
      cleaned[key] = value;
    }
  }

  const rows = await db
    .update(community)
    .set(cleaned)
    .where(and(eq(community.id, communityId), isNull(community.archivedAt)))
    .returning();

  return rows[0] ?? null;
}

export async function archiveCommunity(communityId: string) {
  const rows = await db
    .update(community)
    .set({ archivedAt: new Date(), isFeatured: false })
    .where(and(eq(community.id, communityId), isNull(community.archivedAt)))
    .returning();

  return rows[0] ?? null;
}

export async function restoreCommunity(communityId: string) {
  const rows = await db
    .update(community)
    .set({ archivedAt: null })
    .where(and(eq(community.id, communityId), isNotNull(community.archivedAt)))
    .returning();

  return rows[0] ?? null;
}

export async function deleteCommunity(communityId: string) {
  // Collect this community + all descendants (including archived) bottom-up
  const rows: { id: string; depth: number }[] = await db.execute(sql`
    WITH RECURSIVE descendants AS (
      SELECT id, depth FROM community WHERE id = ${communityId}
      UNION ALL
      SELECT c.id, c.depth
      FROM community c
      JOIN descendants d ON c.parent_id = d.id
    )
    SELECT id, depth FROM descendants ORDER BY depth DESC
  `);

  const allIds = rows.map((r) => r.id);
  if (allIds.length === 0) return null;

  // Clean up reactions & bookmarks for posts in these communities (no FK cascade)
  await db.execute(sql`
    DELETE FROM reaction
    WHERE target_id IN (
      SELECT id FROM post WHERE community_id IN ${sql`(${sql.join(allIds.map((id) => sql`${id}`), sql`, `)})`}
    )
    OR target_id IN (
      SELECT c.id FROM comment c
      JOIN post p ON c.post_id = p.id
      WHERE p.community_id IN ${sql`(${sql.join(allIds.map((id) => sql`${id}`), sql`, `)})`}
    )
  `);

  await db.execute(sql`
    DELETE FROM bookmark
    WHERE target_id IN (
      SELECT id FROM post WHERE community_id IN ${sql`(${sql.join(allIds.map((id) => sql`${id}`), sql`, `)})`}
    )
  `);

  // Delete communities bottom-up (deepest children first)
  // ON DELETE CASCADE handles memberships, posts, comments, flags, invites, etc.
  for (const row of rows) {
    await db.delete(community).where(eq(community.id, row.id));
  }

  return { deleted: allIds.length };
}

export async function setCommunityFeatured(
  communityId: string,
  isFeatured: boolean,
) {
  const rows = await db
    .update(community)
    .set({ isFeatured })
    .where(eq(community.id, communityId))
    .returning();

  return rows[0] ?? null;
}

export async function checkSlugAvailable(
  slug: string,
  excludeCommunityId?: string,
) {
  const normalized = slug.trim().toLowerCase();
  const rows = await db
    .select({ id: community.id })
    .from(community)
    .where(eq(community.slug, normalized))
    .limit(1);

  if (rows.length === 0) return true;
  if (excludeCommunityId && rows[0].id === excludeCommunityId) return true;
  return false;
}

export async function getListedCommunities() {
  const communities = await db
    .select()
    .from(community)
    .where(
      and(eq(community.visibility, "listed"), isNull(community.archivedAt)),
    )
    .orderBy(community.createdAt);

  return communities;
}

// ── Community directory (enriched with counts) ──────────────────────

interface CommunityDirectoryOpts {
  limit: number;
  offset: number;
  search?: string;
  location?: string;
  sort?: "newest" | "members";
}

export async function getDirectoryCommunities(opts: CommunityDirectoryOpts) {
  const conditions = [
    isNull(community.parentId),
    eq(community.visibility, "listed"),
    isNull(community.archivedAt),
  ];

  if (opts.search) {
    const term = `%${opts.search}%`;
    conditions.push(
      sql`(
        ${community.name} ILIKE ${term}
        OR ${community.description} ILIKE ${term}
        OR ${community.tagline} ILIKE ${term}
      )`,
    );
  }

  if (opts.location) {
    conditions.push(sql`${community.location} ILIKE ${`%${opts.location}%`}`);
  }

  const where = and(...conditions);

  const memberCountSq = sql<number>`(
    SELECT count(*)::int FROM membership m
    WHERE m.community_id = community.id
      AND m.status = 'active'
  )`.as("member_count");

  const chapterCountSq = sql<number>`(
    SELECT count(*)::int FROM community sub
    WHERE sub.parent_id = community.id
      AND sub.archived_at IS NULL
  )`.as("chapter_count");

  const orderBy =
    opts.sort === "members"
      ? desc(sql`member_count`)
      : desc(community.createdAt);

  const rows = await db
    .select({
      id: community.id,
      name: community.name,
      slug: community.slug,
      description: community.description,
      tagline: community.tagline,
      location: community.location,
      logoUrl: community.logoUrl,
      bannerUrl: community.bannerUrl,
      primaryColor: community.primaryColor,
      joinPolicy: community.joinPolicy,
      createdAt: community.createdAt,
      memberCount: memberCountSq,
      chapterCount: chapterCountSq,
    })
    .from(community)
    .where(where)
    .orderBy(orderBy)
    .limit(opts.limit)
    .offset(opts.offset);

  const [totalRow] = await db
    .select({ count: count() })
    .from(community)
    .where(where);

  return {
    communities: rows as DirectoryCommunity[],
    total: totalRow?.count ?? 0,
  };
}

type PlatformCommunityStatusFilter = "active" | "archived" | "all";

interface PlatformCommunityOpts {
  limit: number;
  offset: number;
  search?: string;
  rootOnly?: boolean;
  status?: PlatformCommunityStatusFilter;
  depth?: number;
}

export async function getPlatformCommunities(opts: PlatformCommunityOpts) {
  const status = opts.status ?? "active";
  const parent = alias(community, "parent_community");
  const memberCountSq = sql<number>`(
    SELECT count(*)::int FROM membership m
    WHERE m.community_id = ${community.id}
      AND m.status = 'active'
  )`.as("member_count");

  const conditions = [];

  if (status === "active") {
    conditions.push(isNull(community.archivedAt));
  } else if (status === "archived") {
    conditions.push(isNotNull(community.archivedAt));
  }

  if (opts.rootOnly) {
    conditions.push(isNull(community.parentId));
  }

  if (opts.depth !== undefined) {
    conditions.push(eq(community.depth, opts.depth));
  }

  if (opts.search) {
    conditions.push(ilike(community.name, `%${opts.search}%`));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select({
      id: community.id,
      name: community.name,
      slug: community.slug,
      parentId: community.parentId,
      parentName: parent.name,
      depth: community.depth,
      isFeatured: community.isFeatured,
      createdAt: community.createdAt,
      archivedAt: community.archivedAt,
      memberCount: memberCountSq,
    })
    .from(community)
    .leftJoin(parent, eq(community.parentId, parent.id))
    .where(where)
    .orderBy(desc(community.createdAt), asc(community.name))
    .limit(opts.limit)
    .offset(opts.offset);

  const [totalRow] = await db
    .select({ count: count() })
    .from(community)
    .where(where);

  return {
    communities: rows as PlatformCommunityListItem[],
    total: totalRow?.count ?? 0,
  };
}

export async function getPlatformCommunityDetail(communityId: string) {
  const parent = alias(community, "parent_community");
  const memberCountSq = sql<number>`(
    SELECT count(*)::int FROM membership m
    WHERE m.community_id = ${community.id}
      AND m.status = 'active'
  )`.as("member_count");
  const contentCountSq = sql<number>`(
    SELECT count(*)::int FROM post p
    WHERE p.community_id = ${community.id}
  )`.as("content_count");
  const childCountSq = sql<number>`(
    SELECT count(*)::int FROM community child
    WHERE child.parent_id = ${community.id}
  )`.as("child_count");

  const rows = await db
    .select({
      id: community.id,
      name: community.name,
      slug: community.slug,
      description: community.description,
      tagline: community.tagline,
      location: community.location,
      logoUrl: community.logoUrl,
      bannerUrl: community.bannerUrl,
      primaryColor: community.primaryColor,
      visibility: community.visibility,
      joinPolicy: community.joinPolicy,
      parentId: community.parentId,
      parentName: parent.name,
      depth: community.depth,
      subTierLabel: community.subTierLabel,
      isFeatured: community.isFeatured,
      createdBy: community.createdBy,
      createdAt: community.createdAt,
      updatedAt: community.updatedAt,
      archivedAt: community.archivedAt,
      memberCount: memberCountSq,
      contentCount: contentCountSq,
      childCount: childCountSq,
    })
    .from(community)
    .leftJoin(parent, eq(community.parentId, parent.id))
    .where(eq(community.id, communityId))
    .limit(1);

  return (rows[0] as PlatformCommunityDetail | undefined) ?? null;
}

export async function getPlatformChildCommunities(parentId: string) {
  const memberCountSq = sql<number>`(
    SELECT count(*)::int FROM membership m
    WHERE m.community_id = ${community.id}
      AND m.status = 'active'
  )`.as("member_count");

  return db
    .select({
      id: community.id,
      name: community.name,
      slug: community.slug,
      depth: community.depth,
      isFeatured: community.isFeatured,
      createdAt: community.createdAt,
      archivedAt: community.archivedAt,
      memberCount: memberCountSq,
    })
    .from(community)
    .where(eq(community.parentId, parentId))
    .orderBy(asc(community.name));
}

export async function getPlatformCommunityPosts(
  communityId: string,
  limit = 12,
) {
  return db
    .select({
      id: post.id,
      title: post.title,
      slug: post.slug,
      status: post.status,
      createdAt: post.createdAt,
      publishedAt: post.publishedAt,
      archivedAt: post.archivedAt,
      hiddenAt: post.hiddenAt,
      authorDisplayName: profile.displayName,
      authorUsername: profile.username,
    })
    .from(post)
    .innerJoin(profile, eq(post.authorId, profile.userId))
    .where(eq(post.communityId, communityId))
    .orderBy(desc(post.createdAt))
    .limit(limit);
}
