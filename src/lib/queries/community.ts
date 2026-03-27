import { and, eq, isNull, count } from "drizzle-orm";
import { db } from "@/db";
import { community, membership } from "@/db/schema";
import { findAvailableSlug } from "@/lib/slug";
import type { CreateCommunityInput, UpdateCommunityInput } from "@/lib/validations/community";

export async function createCommunity(
  userId: string,
  data: CreateCommunityInput,
) {
  const slug = data.slug || (await findAvailableSlug(data.name));
  const communityId = crypto.randomUUID();
  const membershipId = crypto.randomUUID();

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
