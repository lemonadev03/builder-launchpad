import { and, eq, count } from "drizzle-orm";
import { db } from "@/db";
import { joinRequest, membership, profile } from "@/db/schema";

export async function createJoinRequest(userId: string, communityId: string) {
  // Check for existing pending request
  const existing = await db
    .select({ id: joinRequest.id, status: joinRequest.status })
    .from(joinRequest)
    .where(
      and(
        eq(joinRequest.userId, userId),
        eq(joinRequest.communityId, communityId),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    return { error: "duplicate" as const, status: existing[0].status };
  }

  // Check if already a member
  const mem = await db
    .select({ id: membership.id })
    .from(membership)
    .where(
      and(
        eq(membership.userId, userId),
        eq(membership.communityId, communityId),
      ),
    )
    .limit(1);

  if (mem.length > 0) {
    return { error: "already_member" as const };
  }

  const [created] = await db
    .insert(joinRequest)
    .values({
      id: crypto.randomUUID(),
      userId,
      communityId,
    })
    .returning();

  return { error: null, request: created };
}

export async function getPendingJoinRequests(communityId: string) {
  return db
    .select({
      id: joinRequest.id,
      userId: joinRequest.userId,
      status: joinRequest.status,
      requestedAt: joinRequest.requestedAt,
      displayName: profile.displayName,
      username: profile.username,
      avatarUrl: profile.avatarUrl,
    })
    .from(joinRequest)
    .innerJoin(profile, eq(joinRequest.userId, profile.userId))
    .where(
      and(
        eq(joinRequest.communityId, communityId),
        eq(joinRequest.status, "pending"),
      ),
    )
    .orderBy(joinRequest.requestedAt);
}

export async function getPendingJoinRequestCount(communityId: string) {
  const [result] = await db
    .select({ count: count() })
    .from(joinRequest)
    .where(
      and(
        eq(joinRequest.communityId, communityId),
        eq(joinRequest.status, "pending"),
      ),
    );

  return result.count;
}

export async function approveJoinRequest(
  requestId: string,
  resolvedBy: string,
) {
  const [req] = await db
    .select()
    .from(joinRequest)
    .where(
      and(eq(joinRequest.id, requestId), eq(joinRequest.status, "pending")),
    )
    .limit(1);

  if (!req) return null;

  // Create membership
  await db.insert(membership).values({
    id: crypto.randomUUID(),
    userId: req.userId,
    communityId: req.communityId,
    role: "member",
    status: "active",
  });

  // Update request status
  const [updated] = await db
    .update(joinRequest)
    .set({
      status: "approved",
      resolvedAt: new Date(),
      resolvedBy,
    })
    .where(eq(joinRequest.id, requestId))
    .returning();

  return updated;
}

export async function rejectJoinRequest(
  requestId: string,
  resolvedBy: string,
) {
  const rows = await db
    .update(joinRequest)
    .set({
      status: "rejected",
      resolvedAt: new Date(),
      resolvedBy,
    })
    .where(
      and(eq(joinRequest.id, requestId), eq(joinRequest.status, "pending")),
    )
    .returning();

  return rows[0] ?? null;
}

export async function getUserJoinRequestStatus(
  userId: string,
  communityId: string,
) {
  const rows = await db
    .select({ status: joinRequest.status })
    .from(joinRequest)
    .where(
      and(
        eq(joinRequest.userId, userId),
        eq(joinRequest.communityId, communityId),
      ),
    )
    .limit(1);

  return rows[0]?.status ?? null;
}
