import { and, eq, isNull, count, sql, inArray } from "drizzle-orm";
import { db } from "@/db";
import { community, membership } from "@/db/schema";

const MAX_DEPTH = 3; // 0-indexed: root=0, max child depth=3 → 4 levels
const MAX_CHILDREN = 50;

export type TreeNode = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  depth: number;
  subTierLabel: string | null;
  memberCount: number;
  isArchived: boolean;
  children: TreeNode[];
};

/**
 * Get the full ancestor chain for a community, from root → ... → parent.
 * Uses a recursive CTE instead of a loop (1 query instead of N).
 */
export async function getAncestorChain(communityId: string) {
  const rows: {
    id: string;
    name: string;
    slug: string;
    parent_id: string | null;
    depth: number;
    sub_tier_label: string | null;
    chain_order: number;
  }[] = await db.execute(sql`
    WITH RECURSIVE ancestors AS (
      SELECT id, name, slug, parent_id, depth, sub_tier_label, 0 AS chain_order
      FROM community
      WHERE id = ${communityId}
      UNION ALL
      SELECT c.id, c.name, c.slug, c.parent_id, c.depth, c.sub_tier_label, a.chain_order + 1
      FROM community c
      JOIN ancestors a ON c.id = a.parent_id
      WHERE a.chain_order < 5
    )
    SELECT * FROM ancestors
    WHERE id != ${communityId}
    ORDER BY chain_order DESC
  `);

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    parentId: r.parent_id,
    depth: r.depth,
    subTierLabel: r.sub_tier_label,
  }));
}

/**
 * Get direct children of a community.
 */
export async function getChildCommunities(parentId: string) {
  return db
    .select({
      id: community.id,
      name: community.name,
      slug: community.slug,
      tagline: community.tagline,
      logoUrl: community.logoUrl,
      depth: community.depth,
      subTierLabel: community.subTierLabel,
      parentId: community.parentId,
    })
    .from(community)
    .where(
      and(eq(community.parentId, parentId), isNull(community.archivedAt)),
    )
    .orderBy(community.name);
}

export async function getRootCommunityId(
  communityId: string,
  opts?: { includeArchived?: boolean },
) {
  const includeArchived = opts?.includeArchived ?? false;

  const archivedFilter = includeArchived
    ? sql``
    : sql`AND c.archived_at IS NULL`;

  const rows: { id: string }[] = await db.execute(sql`
    WITH RECURSIVE ancestors AS (
      SELECT id, parent_id, archived_at
      FROM community
      WHERE id = ${communityId}
      UNION ALL
      SELECT c.id, c.parent_id, c.archived_at
      FROM community c
      JOIN ancestors a ON c.id = a.parent_id
      WHERE TRUE ${archivedFilter}
    )
    SELECT id FROM ancestors
    ORDER BY (parent_id IS NULL) DESC
    LIMIT 1
  `);

  return rows[0]?.id ?? communityId;
}

/**
 * Get all descendants of a community (recursive, bounded by max depth).
 * Uses a recursive CTE instead of N queries per depth level.
 */
export async function getAllDescendants(communityId: string) {
  const rows: {
    id: string;
    name: string;
    slug: string;
    depth: number;
    parent_id: string | null;
  }[] = await db.execute(sql`
    WITH RECURSIVE descendants AS (
      SELECT id, name, slug, depth, parent_id, 0 AS tree_depth
      FROM community
      WHERE parent_id = ${communityId} AND archived_at IS NULL
      UNION ALL
      SELECT c.id, c.name, c.slug, c.depth, c.parent_id, d.tree_depth + 1
      FROM community c
      JOIN descendants d ON c.parent_id = d.id
      WHERE c.archived_at IS NULL AND d.tree_depth < ${MAX_DEPTH}
    )
    SELECT id, name, slug, depth, parent_id FROM descendants
  `);

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    depth: r.depth,
    parentId: r.parent_id,
  }));
}

/**
 * Get the count of direct children of a community.
 */
export async function getChildCount(parentId: string) {
  const [result] = await db
    .select({ count: count() })
    .from(community)
    .where(
      and(eq(community.parentId, parentId), isNull(community.archivedAt)),
    );

  return result.count;
}

/**
 * Validate that a sub-community can be created under the given parent.
 */
export async function validateSubCommunityCreation(parentId: string) {
  const [parent] = await db
    .select({
      id: community.id,
      depth: community.depth,
      archivedAt: community.archivedAt,
    })
    .from(community)
    .where(eq(community.id, parentId))
    .limit(1);

  if (!parent || parent.archivedAt) {
    return { allowed: false, error: "Parent community not found" };
  }

  if (parent.depth >= MAX_DEPTH) {
    return {
      allowed: false,
      error: "Maximum nesting depth reached (4 levels)",
    };
  }

  const childCount = await getChildCount(parentId);
  if (childCount >= MAX_CHILDREN) {
    return {
      allowed: false,
      error: `Maximum ${MAX_CHILDREN} sub-communities per parent`,
    };
  }

  return { allowed: true, error: null, parentDepth: parent.depth };
}

/**
 * Get the full tree structure for a root community (for org chart).
 * Fetches all descendants + member counts in 2 queries, builds tree in memory.
 */
export async function getCommunityTree(
  rootId: string,
  opts?: { includeArchived?: boolean },
) {
  const includeArchived = opts?.includeArchived ?? false;

  const archivedFilter = includeArchived
    ? sql``
    : sql`AND c.archived_at IS NULL`;

  // 1. Fetch all nodes in the tree with a single recursive CTE
  const rows: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    depth: number;
    sub_tier_label: string | null;
    archived_at: Date | null;
    parent_id: string | null;
  }[] = await db.execute(sql`
    WITH RECURSIVE tree AS (
      SELECT id, name, slug, logo_url, depth, sub_tier_label, archived_at, parent_id
      FROM community
      WHERE id = ${rootId}
      UNION ALL
      SELECT c.id, c.name, c.slug, c.logo_url, c.depth, c.sub_tier_label, c.archived_at, c.parent_id
      FROM community c
      JOIN tree t ON c.parent_id = t.id
      WHERE TRUE ${archivedFilter}
    )
    SELECT * FROM tree
  `);

  if (rows.length === 0) return null;

  // 2. Batch-fetch member counts for all nodes
  const nodeIds = rows.map((r) => r.id);
  const memberCounts = await db
    .select({
      communityId: membership.communityId,
      count: count(),
    })
    .from(membership)
    .where(
      and(
        inArray(membership.communityId, nodeIds),
        eq(membership.status, "active"),
      ),
    )
    .groupBy(membership.communityId);

  const countMap = new Map(memberCounts.map((r) => [r.communityId, r.count]));

  // 3. Build tree in memory
  const nodeMap = new Map<string, TreeNode>();
  for (const r of rows) {
    nodeMap.set(r.id, {
      id: r.id,
      name: r.name,
      slug: r.slug,
      logoUrl: r.logo_url,
      depth: r.depth,
      subTierLabel: r.sub_tier_label,
      memberCount: countMap.get(r.id) ?? 0,
      isArchived: r.archived_at !== null,
      children: [],
    });
  }

  // Wire up parent → children
  for (const r of rows) {
    if (r.parent_id && nodeMap.has(r.parent_id)) {
      nodeMap.get(r.parent_id)!.children.push(nodeMap.get(r.id)!);
    }
  }

  // Sort children by name
  for (const node of nodeMap.values()) {
    node.children.sort((a, b) => a.name.localeCompare(b.name));
  }

  return nodeMap.get(rootId) ?? null;
}
