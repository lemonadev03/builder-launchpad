import { and, eq, isNull, count, desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { community, membership } from "@/db/schema";
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
    .set({ archivedAt: new Date() })
    .where(and(eq(community.id, communityId), isNull(community.archivedAt)))
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
