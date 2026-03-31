import { and, eq, count, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { membership, profile, community } from "@/db/schema";
import { cascadeLeaveDescendants } from "@/lib/queries/membership-inheritance";

export async function getMembership(userId: string, communityId: string) {
  const rows = await db
    .select()
    .from(membership)
    .where(
      and(
        eq(membership.userId, userId),
        eq(membership.communityId, communityId),
      ),
    )
    .limit(1);

  return rows[0] ?? null;
}

export async function getMembersByCommunity(communityId: string) {
  return db
    .select({
      id: membership.id,
      userId: membership.userId,
      communityId: membership.communityId,
      role: membership.role,
      status: membership.status,
      joinedAt: membership.joinedAt,
      displayName: profile.displayName,
      username: profile.username,
      avatarUrl: profile.avatarUrl,
    })
    .from(membership)
    .innerJoin(profile, eq(membership.userId, profile.userId))
    .where(eq(membership.communityId, communityId))
    .orderBy(membership.joinedAt);
}

export async function updateMemberRole(
  membershipId: string,
  role: "admin" | "moderator" | "member",
) {
  const rows = await db
    .update(membership)
    .set({ role })
    .where(eq(membership.id, membershipId))
    .returning();

  return rows[0] ?? null;
}

export async function removeMember(membershipId: string) {
  return db.transaction(async (tx) => {
    const [mem] = await tx
      .select({
        id: membership.id,
        userId: membership.userId,
        communityId: membership.communityId,
      })
      .from(membership)
      .where(eq(membership.id, membershipId))
      .limit(1);

    if (!mem) return null;

    const rows = await tx
      .delete(membership)
      .where(eq(membership.id, membershipId))
      .returning();

    // Cascade-remove from all descendants (within same transaction)
    await cascadeLeaveDescendants(mem.userId, mem.communityId);

    return rows[0] ?? null;
  });
}

export async function getMemberCount(communityId: string) {
  const [result] = await db
    .select({ count: count() })
    .from(membership)
    .where(
      and(
        eq(membership.communityId, communityId),
        eq(membership.status, "active"),
      ),
    );

  return result.count;
}

export async function getPendingRequestCount(communityId: string) {
  const [result] = await db
    .select({ count: count() })
    .from(membership)
    .where(
      and(
        eq(membership.communityId, communityId),
        eq(membership.status, "pending"),
      ),
    );

  return result.count;
}

export async function getAdminCount(communityId: string) {
  const [result] = await db
    .select({ count: count() })
    .from(membership)
    .where(
      and(
        eq(membership.communityId, communityId),
        eq(membership.role, "admin"),
        eq(membership.status, "active"),
      ),
    );

  return result.count;
}

export async function warnMember(membershipId: string) {
  const [updated] = await db
    .update(membership)
    .set({ warningCount: sql`${membership.warningCount} + 1` })
    .where(eq(membership.id, membershipId))
    .returning();

  return updated ?? null;
}

export async function suspendMember(membershipId: string) {
  const rows = await db
    .update(membership)
    .set({ status: "suspended" })
    .where(
      and(eq(membership.id, membershipId), eq(membership.status, "active")),
    )
    .returning();

  return rows[0] ?? null;
}

export async function unsuspendMember(membershipId: string) {
  const rows = await db
    .update(membership)
    .set({ status: "active" })
    .where(
      and(
        eq(membership.id, membershipId),
        eq(membership.status, "suspended"),
      ),
    )
    .returning();

  return rows[0] ?? null;
}

export async function leaveCommunity(userId: string, communityId: string) {
  const mem = await getMembership(userId, communityId);
  if (!mem || mem.status !== "active") return { error: "not_member" as const };

  // Block if last admin
  if (mem.role === "admin") {
    const adminCount = await getAdminCount(communityId);
    if (adminCount <= 1) return { error: "last_admin" as const };
  }

  // Atomic: remove from this community + cascade descendants
  await db.transaction(async (tx) => {
    await tx.delete(membership).where(eq(membership.id, mem.id));
    await cascadeLeaveDescendants(userId, communityId);
  });

  return { error: null };
}

export async function canRejoin() {
  // Hard-deletes mean no leftAt to check — always allow.
  // The unique constraint prevents duplicate active memberships.
  return true;
}

export async function getSuspendedMembers(communityIds: string[]) {
  if (communityIds.length === 0) return [];

  return db
    .select({
      membershipId: membership.id,
      userId: membership.userId,
      communityId: membership.communityId,
      role: membership.role,
      joinedAt: membership.joinedAt,
      displayName: profile.displayName,
      username: profile.username,
      avatarUrl: profile.avatarUrl,
      communityName: community.name,
      communitySlug: community.slug,
    })
    .from(membership)
    .innerJoin(profile, eq(membership.userId, profile.userId))
    .innerJoin(community, eq(membership.communityId, community.id))
    .where(
      and(
        inArray(membership.communityId, communityIds),
        eq(membership.status, "suspended"),
      ),
    );
}

export async function getUserCommunities(userId: string) {
  return db
    .select({
      membershipId: membership.id,
      communityId: membership.communityId,
      role: membership.role,
      status: membership.status,
      joinedAt: membership.joinedAt,
      communityName: community.name,
      communitySlug: community.slug,
      communityLogoUrl: community.logoUrl,
    })
    .from(membership)
    .innerJoin(community, eq(membership.communityId, community.id))
    .where(
      and(eq(membership.userId, userId), eq(membership.status, "active")),
    )
    .orderBy(membership.joinedAt);
}
