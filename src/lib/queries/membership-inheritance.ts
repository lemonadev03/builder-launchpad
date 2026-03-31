import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { membership, community } from "@/db/schema";

/**
 * Auto-join all ancestor communities when joining a child.
 * Uses a recursive CTE to get the full parent chain in 1 query,
 * then batch-inserts missing memberships.
 */
export async function joinAncestors(userId: string, communityId: string) {
  // Get all ancestor IDs in one query
  const ancestors: { id: string }[] = await db.execute(sql`
    WITH RECURSIVE ancestors AS (
      SELECT parent_id
      FROM community
      WHERE id = ${communityId}
      UNION ALL
      SELECT c.parent_id
      FROM community c
      JOIN ancestors a ON c.id = a.parent_id
      WHERE a.parent_id IS NOT NULL
    )
    SELECT parent_id AS id FROM ancestors WHERE parent_id IS NOT NULL
  `);

  if (ancestors.length === 0) return;

  const ancestorIds = ancestors.map((a) => a.id);

  // Find which ancestors the user is NOT already a member of
  const existing = await db
    .select({ communityId: membership.communityId })
    .from(membership)
    .where(
      and(
        eq(membership.userId, userId),
        inArray(membership.communityId, ancestorIds),
      ),
    );

  const existingIds = new Set(existing.map((e) => e.communityId));
  const missing = ancestorIds.filter((id) => !existingIds.has(id));

  if (missing.length === 0) return;

  // Batch-insert all missing memberships
  await db.insert(membership).values(
    missing.map((communityId) => ({
      id: crypto.randomUUID(),
      userId,
      communityId,
      role: "member" as const,
      status: "active" as const,
    })),
  );
}

/**
 * Cascade-remove from all descendants when leaving a parent.
 * Uses a recursive CTE to get all descendant IDs in 1 query,
 * then batch-deletes memberships.
 */
export async function cascadeLeaveDescendants(
  userId: string,
  communityId: string,
) {
  const descendants: { id: string }[] = await db.execute(sql`
    WITH RECURSIVE descendants AS (
      SELECT id FROM community
      WHERE parent_id = ${communityId} AND archived_at IS NULL
      UNION ALL
      SELECT c.id FROM community c
      JOIN descendants d ON c.parent_id = d.id
      WHERE c.archived_at IS NULL
    )
    SELECT id FROM descendants
  `);

  if (descendants.length === 0) return;

  await db
    .delete(membership)
    .where(
      and(
        eq(membership.userId, userId),
        inArray(
          membership.communityId,
          descendants.map((d) => d.id),
        ),
      ),
    );
}
