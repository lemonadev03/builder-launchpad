import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { membership, community } from "@/db/schema";

/**
 * Auto-join all ancestor communities when joining a child.
 * Creates membership at each parent level if not already a member.
 * Auto-joined memberships get "member" role.
 */
export async function joinAncestors(userId: string, communityId: string) {
  let currentId: string | null = communityId;
  let iterations = 0;

  while (currentId && iterations < 5) {
    const [comm] = await db
      .select({ parentId: community.parentId })
      .from(community)
      .where(eq(community.id, currentId))
      .limit(1);

    if (!comm?.parentId) break;

    // Check if already a member of parent
    const existing = await db
      .select({ id: membership.id })
      .from(membership)
      .where(
        and(
          eq(membership.userId, userId),
          eq(membership.communityId, comm.parentId),
        ),
      )
      .limit(1);

    if (existing.length === 0) {
      await db.insert(membership).values({
        id: crypto.randomUUID(),
        userId,
        communityId: comm.parentId,
        role: "member",
        status: "active",
      });
    }

    currentId = comm.parentId;
    iterations++;
  }
}

/**
 * Cascade-remove from all descendants when leaving a parent.
 * Removes membership from the community and all sub-communities.
 */
export async function cascadeLeaveDescendants(
  userId: string,
  communityId: string,
) {
  // Collect all descendant community IDs
  const descendantIds: string[] = [];

  async function collect(parentId: string, depth: number) {
    if (depth > 4) return;

    const children = await db
      .select({ id: community.id })
      .from(community)
      .where(eq(community.parentId, parentId));

    for (const child of children) {
      descendantIds.push(child.id);
      await collect(child.id, depth + 1);
    }
  }

  await collect(communityId, 0);

  // Remove membership from all descendants
  for (const descId of descendantIds) {
    await db
      .delete(membership)
      .where(
        and(
          eq(membership.userId, userId),
          eq(membership.communityId, descId),
        ),
      );
  }
}
