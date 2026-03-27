import { and, eq, count } from "drizzle-orm";
import { db } from "@/db";
import { membership, profile } from "@/db/schema";

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
    .where(
      and(
        eq(membership.communityId, communityId),
        eq(membership.status, "active"),
      ),
    )
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
  const rows = await db
    .delete(membership)
    .where(eq(membership.id, membershipId))
    .returning();

  return rows[0] ?? null;
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
