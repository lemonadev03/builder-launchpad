import { and, eq, or, count, sql } from "drizzle-orm";
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

/** Get all sister links: direct + inherited from ancestors */
export async function getAllSisterLinks(communityId: string) {
  const direct = await getDirectSisterLinks(communityId);

  const ancestors = await getAncestorChain(communityId);
  const inherited: SisterLinkWithCommunity[] = [];

  // Collect direct sister IDs for this community to avoid showing duplicates
  const directSisterIds = new Set(direct.map((d) => d.communityId));

  for (const ancestor of ancestors) {
    const ancestorLinks = await getDirectSisterLinks(ancestor.id);
    for (const link of ancestorLinks) {
      if (link.status !== "active") continue;
      // Skip if this community already has a direct link with the same sister
      if (directSisterIds.has(link.communityId)) continue;
      // Skip if already inherited from a closer ancestor
      if (inherited.some((i) => i.communityId === link.communityId)) continue;
      // Skip if the sister is one of our own ancestors
      if (ancestors.some((a) => a.id === link.communityId)) continue;
      // Skip if the sister is the community itself
      if (link.communityId === communityId) continue;

      inherited.push({
        ...link,
        inherited: true,
        inheritedFromName: ancestor.name,
      });
    }
  }

  return [...direct, ...inherited];
}

/** Count of direct sister links for anti-abuse */
export async function getDirectSisterLinkCount(
  communityId: string,
): Promise<number> {
  const [row] = await db
    .select({ count: count() })
    .from(sisterLink)
    .where(
      or(
        eq(sisterLink.communityAId, communityId),
        eq(sisterLink.communityBId, communityId),
      ),
    );

  return row?.count ?? 0;
}

/**
 * Check if a sister link between these two communities (or their ancestors)
 * already exists. Returns the blocking link info or null if clear.
 */
export async function checkDuplicateSisterLink(
  communityAId: string,
  communityBId: string,
): Promise<{ exists: boolean; reason?: string }> {
  // Get ancestor chains for both communities (including themselves)
  const ancestorsA = await getAncestorChain(communityAId);
  const ancestorsB = await getAncestorChain(communityBId);

  const allIdsA = [communityAId, ...ancestorsA.map((a) => a.id)];
  const allIdsB = [communityBId, ...ancestorsB.map((a) => a.id)];

  // Check if any combination of (ancestorOfA, ancestorOfB) has an existing link
  for (const idA of allIdsA) {
    for (const idB of allIdsB) {
      if (idA === idB) continue;
      const [aId, bId] = canonicalOrder(idA, idB);

      const existing = await db
        .select({ id: sisterLink.id, status: sisterLink.status })
        .from(sisterLink)
        .where(
          and(
            eq(sisterLink.communityAId, aId),
            eq(sisterLink.communityBId, bId),
          ),
        )
        .limit(1);

      if (existing.length > 0) {
        return {
          exists: true,
          reason:
            idA === communityAId && idB === communityBId
              ? "A sister link already exists between these communities"
              : "An ancestor community already has a sister link with this community or its ancestor",
        };
      }
    }
  }

  return { exists: false };
}
