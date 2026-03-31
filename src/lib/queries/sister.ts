import { and, eq, or, count, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { sisterLink, community } from "@/db/schema";
import { getAncestorChain } from "@/lib/queries/community-tree";

// ── Helpers ─────────────────────────────────────────────────────────

/** Canonical order so (A,B) and (B,A) map to the same row */
function canonicalOrder(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

// ── Mutations ───────────────────────────────────────────────────────

export async function createSisterRequest(
  fromCommunityId: string,
  toCommunityId: string,
  requestedBy: string,
) {
  const [aId, bId] = canonicalOrder(fromCommunityId, toCommunityId);

  const [created] = await db
    .insert(sisterLink)
    .values({
      id: crypto.randomUUID(),
      communityAId: aId,
      communityBId: bId,
      status: "pending",
      requestedCommunityId: fromCommunityId,
      requestedBy,
    })
    .onConflictDoNothing()
    .returning();

  return created ?? null;
}

export async function acceptSisterRequest(linkId: string) {
  const [updated] = await db
    .update(sisterLink)
    .set({ status: "active" })
    .where(and(eq(sisterLink.id, linkId), eq(sisterLink.status, "pending")))
    .returning();

  return updated ?? null;
}

export async function declineSisterRequest(linkId: string) {
  const [deleted] = await db
    .delete(sisterLink)
    .where(and(eq(sisterLink.id, linkId), eq(sisterLink.status, "pending")))
    .returning();

  return deleted ?? null;
}

export async function removeSisterLink(linkId: string) {
  const [deleted] = await db
    .delete(sisterLink)
    .where(eq(sisterLink.id, linkId))
    .returning();

  return deleted ?? null;
}

// ── Queries ─────────────────────────────────────────────────────────

export async function getSisterLinkById(linkId: string) {
  const rows = await db
    .select()
    .from(sisterLink)
    .where(eq(sisterLink.id, linkId))
    .limit(1);

  return rows[0] ?? null;
}

export type SisterLinkWithCommunity = {
  linkId: string;
  status: string;
  communityId: string;
  communityName: string;
  communitySlug: string;
  communityLogoUrl: string | null;
  requestedCommunityId: string;
  inherited: boolean;
  inheritedFromName: string | null;
  createdAt: Date;
};

/** Get direct sister links for a community (both directions) */
export async function getDirectSisterLinks(communityId: string) {
  const rows = await db
    .select({
      linkId: sisterLink.id,
      status: sisterLink.status,
      communityAId: sisterLink.communityAId,
      communityBId: sisterLink.communityBId,
      requestedCommunityId: sisterLink.requestedCommunityId,
      createdAt: sisterLink.createdAt,
    })
    .from(sisterLink)
    .where(
      or(
        eq(sisterLink.communityAId, communityId),
        eq(sisterLink.communityBId, communityId),
      ),
    );

  // Resolve the "other" community for each link
  const otherIds = rows.map((r) =>
    r.communityAId === communityId ? r.communityBId : r.communityAId,
  );

  if (otherIds.length === 0) return [];

  const communities = await db
    .select({
      id: community.id,
      name: community.name,
      slug: community.slug,
      logoUrl: community.logoUrl,
    })
    .from(community)
    .where(sql`${community.id} IN (${sql.join(otherIds.map((id) => sql`${id}`), sql`, `)})`);

  const commMap = new Map(communities.map((c) => [c.id, c]));

  return rows.map((r): SisterLinkWithCommunity => {
    const otherId =
      r.communityAId === communityId ? r.communityBId : r.communityAId;
    const comm = commMap.get(otherId);
    return {
      linkId: r.linkId,
      status: r.status,
      communityId: otherId,
      communityName: comm?.name ?? "",
      communitySlug: comm?.slug ?? "",
      communityLogoUrl: comm?.logoUrl ?? null,
      requestedCommunityId: r.requestedCommunityId,
      inherited: false,
      inheritedFromName: null,
      createdAt: r.createdAt,
    };
  });
}

/**
 * Get all sister links: direct + inherited from ancestors.
 * Gets ancestors (1 CTE query) then fetches ALL ancestor links in a single query.
 */
export async function getAllSisterLinks(communityId: string) {
  const direct = await getDirectSisterLinks(communityId);
  const ancestors = await getAncestorChain(communityId);

  if (ancestors.length === 0) return direct;

  const ancestorIds = ancestors.map((a) => a.id);

  // Fetch ALL sister links for ALL ancestors in one query
  const ancestorLinks = await db
    .select({
      linkId: sisterLink.id,
      status: sisterLink.status,
      communityAId: sisterLink.communityAId,
      communityBId: sisterLink.communityBId,
      requestedCommunityId: sisterLink.requestedCommunityId,
      createdAt: sisterLink.createdAt,
    })
    .from(sisterLink)
    .where(
      and(
        eq(sisterLink.status, "active"),
        or(
          sql`${sisterLink.communityAId} IN (${sql.join(ancestorIds.map((id) => sql`${id}`), sql`, `)})`,
          sql`${sisterLink.communityBId} IN (${sql.join(ancestorIds.map((id) => sql`${id}`), sql`, `)})`,
        ),
      ),
    );

  // Resolve the "other" community for each link
  const otherIds = new Set<string>();
  for (const link of ancestorLinks) {
    // The "owner" side of the link is whichever ancestor matched
    const ownerIsA = ancestorIds.includes(link.communityAId);
    const otherId = ownerIsA ? link.communityBId : link.communityAId;
    otherIds.add(otherId);
  }

  const directSisterIds = new Set(direct.map((d) => d.communityId));
  const ancestorIdSet = new Set(ancestorIds);
  const ancestorNameMap = new Map(ancestors.map((a) => [a.id, a.name]));

  // Batch-fetch community info for the "other" side
  const otherIdArr = [...otherIds];
  let commMap = new Map<string, { id: string; name: string; slug: string; logoUrl: string | null }>();
  if (otherIdArr.length > 0) {
    const communities = await db
      .select({
        id: community.id,
        name: community.name,
        slug: community.slug,
        logoUrl: community.logoUrl,
      })
      .from(community)
      .where(sql`${community.id} IN (${sql.join(otherIdArr.map((id) => sql`${id}`), sql`, `)})`);
    commMap = new Map(communities.map((c) => [c.id, c]));
  }

  const inherited: SisterLinkWithCommunity[] = [];
  const seenCommunities = new Set<string>();

  for (const link of ancestorLinks) {
    const ownerIsA = ancestorIds.includes(link.communityAId);
    const ownerId = ownerIsA ? link.communityAId : link.communityBId;
    const otherId = ownerIsA ? link.communityBId : link.communityAId;

    // Skip duplicates, self-links, direct links, and ancestor references
    if (directSisterIds.has(otherId)) continue;
    if (seenCommunities.has(otherId)) continue;
    if (ancestorIdSet.has(otherId)) continue;
    if (otherId === communityId) continue;

    seenCommunities.add(otherId);
    const comm = commMap.get(otherId);

    inherited.push({
      linkId: link.linkId,
      status: link.status,
      communityId: otherId,
      communityName: comm?.name ?? "",
      communitySlug: comm?.slug ?? "",
      communityLogoUrl: comm?.logoUrl ?? null,
      requestedCommunityId: link.requestedCommunityId,
      inherited: true,
      inheritedFromName: ancestorNameMap.get(ownerId) ?? null,
      createdAt: link.createdAt,
    });
  }

  return [...direct, ...inherited];
}

/** Count of active direct sister links for anti-abuse cap */
export async function getDirectSisterLinkCount(
  communityId: string,
): Promise<number> {
  const [row] = await db
    .select({ count: count() })
    .from(sisterLink)
    .where(
      and(
        or(
          eq(sisterLink.communityAId, communityId),
          eq(sisterLink.communityBId, communityId),
        ),
        eq(sisterLink.status, "active"),
      ),
    );

  return row?.count ?? 0;
}

/**
 * Check if a sister link between these two communities (or their ancestors)
 * already exists. Fetches both ancestor chains, then checks all pairs in a
 * single query instead of N*M individual lookups.
 */
export async function checkDuplicateSisterLink(
  communityAId: string,
  communityBId: string,
): Promise<{ exists: boolean; reason?: string }> {
  const [ancestorsA, ancestorsB] = await Promise.all([
    getAncestorChain(communityAId),
    getAncestorChain(communityBId),
  ]);

  const allIdsA = [communityAId, ...ancestorsA.map((a) => a.id)];
  const allIdsB = [communityBId, ...ancestorsB.map((a) => a.id)];

  // Build all canonical pairs, excluding self-links
  const conditions = [];
  for (const idA of allIdsA) {
    for (const idB of allIdsB) {
      if (idA === idB) continue;
      const [canonical_a, canonical_b] = canonicalOrder(idA, idB);
      conditions.push(
        sql`(${sisterLink.communityAId} = ${canonical_a} AND ${sisterLink.communityBId} = ${canonical_b})`,
      );
    }
  }

  if (conditions.length === 0) return { exists: false };

  // Single query: check all pairs at once
  const existing = await db
    .select({
      id: sisterLink.id,
      communityAId: sisterLink.communityAId,
      communityBId: sisterLink.communityBId,
    })
    .from(sisterLink)
    .where(sql`(${sql.join(conditions, sql` OR `)})`)
    .limit(1);

  if (existing.length === 0) return { exists: false };

  const hit = existing[0];
  const isDirect =
    (hit.communityAId === communityAId || hit.communityAId === communityBId) &&
    (hit.communityBId === communityAId || hit.communityBId === communityBId);

  return {
    exists: true,
    reason: isDirect
      ? "A sister link already exists between these communities"
      : "An ancestor community already has a sister link with this community or its ancestor",
  };
}

// ── Platform-wide queries ──────────────────────────────────────────

export type PlatformSisterLink = {
  linkId: string;
  status: "pending" | "active";
  communityAId: string;
  communityAName: string;
  communityBId: string;
  communityBName: string;
  requestedCommunityId: string;
  createdAt: Date;
};

/** Fetch every sister link on the platform with both community names resolved. */
export async function getAllPlatformSisterLinks(): Promise<PlatformSisterLink[]> {
  const commA = alias(community, "comm_a");
  const commB = alias(community, "comm_b");

  const rows = await db
    .select({
      linkId: sisterLink.id,
      status: sisterLink.status,
      communityAId: sisterLink.communityAId,
      communityAName: commA.name,
      communityBId: sisterLink.communityBId,
      communityBName: commB.name,
      requestedCommunityId: sisterLink.requestedCommunityId,
      createdAt: sisterLink.createdAt,
    })
    .from(sisterLink)
    .innerJoin(commA, eq(sisterLink.communityAId, commA.id))
    .innerJoin(commB, eq(sisterLink.communityBId, commB.id));

  return rows as PlatformSisterLink[];
}
