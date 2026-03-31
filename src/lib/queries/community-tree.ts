import { and, eq, isNull, count } from "drizzle-orm";
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
 * Get the full ancestor chain for a community, from immediate parent to root.
 */
export async function getAncestorChain(communityId: string) {
  const ancestors: {
    id: string;
    name: string;
    slug: string;
    parentId: string | null;
    depth: number;
    subTierLabel: string | null;
  }[] = [];

  let currentId: string | null = communityId;
  let iterations = 0;

  while (currentId && iterations < 5) {
    const [comm] = await db
      .select({
        id: community.id,
        name: community.name,
        slug: community.slug,
        parentId: community.parentId,
        depth: community.depth,
        subTierLabel: community.subTierLabel,
      })
      .from(community)
      .where(eq(community.id, currentId))
      .limit(1);

    if (!comm) break;

    // Don't include the starting community itself
    if (comm.id !== communityId) {
      ancestors.push(comm);
    }

    currentId = comm.parentId;
    iterations++;
  }

  return ancestors.reverse(); // root → ... → parent
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
  let currentId: string | null = communityId;
  let rootId = communityId;
  let iterations = 0;

  while (currentId && iterations < 5) {
    const [comm] = await db
      .select({
        id: community.id,
        parentId: community.parentId,
        archivedAt: community.archivedAt,
      })
      .from(community)
      .where(eq(community.id, currentId))
      .limit(1);

    if (!comm) break;
    if (!includeArchived && comm.archivedAt) break;

    rootId = comm.id;
    currentId = comm.parentId;
    iterations++;
  }

  return rootId;
}

/**
 * Get all descendants of a community (recursive, bounded by max depth).
 */
export async function getAllDescendants(communityId: string) {
  const descendants: { id: string; name: string; slug: string; depth: number; parentId: string | null }[] = [];

  async function collect(parentId: string, currentDepth: number) {
    if (currentDepth > MAX_DEPTH) return;

    const children = await db
      .select({
        id: community.id,
        name: community.name,
        slug: community.slug,
        depth: community.depth,
        parentId: community.parentId,
      })
      .from(community)
      .where(
        and(eq(community.parentId, parentId), isNull(community.archivedAt)),
      );

    for (const child of children) {
      descendants.push(child);
      await collect(child.id, currentDepth + 1);
    }
  }

  await collect(communityId, 0);
  return descendants;
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
 */
export async function getCommunityTree(
  rootId: string,
  opts?: { includeArchived?: boolean },
) {
  const includeArchived = opts?.includeArchived ?? false;

  async function buildNode(communityId: string): Promise<TreeNode | null> {
    const conditions = [eq(community.id, communityId)];
    if (!includeArchived) {
      conditions.push(isNull(community.archivedAt));
    }

    const [comm] = await db
      .select({
        id: community.id,
        name: community.name,
        slug: community.slug,
        logoUrl: community.logoUrl,
        depth: community.depth,
        subTierLabel: community.subTierLabel,
        archivedAt: community.archivedAt,
      })
      .from(community)
      .where(and(...conditions))
      .limit(1);

    if (!comm) return null;

    const [memberCount] = await db
      .select({ count: count() })
      .from(membership)
      .where(
        and(
          eq(membership.communityId, communityId),
          eq(membership.status, "active"),
        ),
      );

    const childConditions = [eq(community.parentId, communityId)];
    if (!includeArchived) {
      childConditions.push(isNull(community.archivedAt));
    }

    const children = await db
      .select({ id: community.id })
      .from(community)
      .where(and(...childConditions))
      .orderBy(community.name);

    const childNodes: TreeNode[] = [];
    for (const child of children) {
      const node = await buildNode(child.id);
      if (node) childNodes.push(node);
    }

    return {
      ...comm,
      memberCount: memberCount.count,
      isArchived: comm.archivedAt !== null,
      children: childNodes,
    };
  }

  return buildNode(rootId);
}
