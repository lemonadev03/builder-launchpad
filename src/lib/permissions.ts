import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema";

// ── Role hierarchy ──────────────────────────────────────────────────

export const ROLE_WEIGHT = {
  member: 1,
  moderator: 2,
  admin: 3,
} as const;

export type CommunityRole = keyof typeof ROLE_WEIGHT;

// ── Actions ─────────────────────────────────────────────────────────

export type CommunityAction =
  | "community.view"
  | "community.edit"
  | "community.delete"
  | "community.manage_members"
  | "community.manage_settings"
  | "community.upload_branding"
  | "member.invite"
  | "member.remove"
  | "member.change_role"
  | "post.create"
  | "post.delete"
  | "comment.create"
  | "comment.delete"
  | "content.moderate";

const REQUIRED_ROLE: Record<CommunityAction, CommunityRole> = {
  "community.view": "member",
  "community.edit": "admin",
  "community.delete": "admin",
  "community.manage_members": "admin",
  "community.manage_settings": "admin",
  "community.upload_branding": "admin",
  "member.invite": "admin",
  "member.remove": "admin",
  "member.change_role": "admin",
  "post.create": "member",
  "post.delete": "moderator",
  "comment.create": "member",
  "comment.delete": "moderator",
  "content.moderate": "moderator",
};

// ── Core permission check ───────────────────────────────────────────

/**
 * Walk the parent chain in a single recursive CTE and find the effective role.
 * Returns: direct membership role at the target community,
 * or the highest inherited role (moderator/admin) from an ancestor.
 *
 * 1 query replaces the previous 2*depth recursive calls.
 */
export async function getEffectiveRole(
  userId: string,
  communityId: string,
): Promise<CommunityRole | null> {
  // Check platform admin first (fast path)
  const userRow = await db
    .select({ isPlatformAdmin: user.isPlatformAdmin })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (userRow[0]?.isPlatformAdmin) return "admin";

  // Single CTE: walk parent chain, join memberships at each level
  const rows: {
    community_id: string;
    chain_depth: number;
    role: CommunityRole | null;
  }[] = await db.execute(sql`
    WITH RECURSIVE parent_chain AS (
      SELECT id, parent_id, 0 AS chain_depth
      FROM community
      WHERE id = ${communityId}
      UNION ALL
      SELECT c.id, c.parent_id, pc.chain_depth + 1
      FROM community c
      JOIN parent_chain pc ON c.id = pc.parent_id
      WHERE pc.chain_depth < 4
    )
    SELECT
      pc.id AS community_id,
      pc.chain_depth,
      m.role
    FROM parent_chain pc
    LEFT JOIN membership m
      ON m.community_id = pc.id
      AND m.user_id = ${userId}
      AND m.status = 'active'
    ORDER BY pc.chain_depth ASC
  `);

  // depth 0 = target community: return whatever role the user has (including member)
  if (rows.length > 0 && rows[0].chain_depth === 0 && rows[0].role) {
    return rows[0].role;
  }

  // depth > 0 = ancestor: only moderator+ cascades down
  for (const row of rows) {
    if (row.chain_depth === 0) continue;
    if (row.role && ROLE_WEIGHT[row.role] >= ROLE_WEIGHT.moderator) {
      return row.role;
    }
  }

  return null;
}

export async function hasPermission(
  userId: string,
  communityId: string,
  action: CommunityAction,
): Promise<boolean> {
  const role = await getEffectiveRole(userId, communityId);
  if (!role) return false;

  const required = REQUIRED_ROLE[action];
  return ROLE_WEIGHT[role] >= ROLE_WEIGHT[required];
}

// ── API route helper ────────────────────────────────────────────────

export async function requireCommunityPermission(
  userId: string,
  communityId: string,
  action: CommunityAction,
): Promise<NextResponse | null> {
  const allowed = await hasPermission(userId, communityId, action);
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}
