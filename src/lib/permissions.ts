import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { user, membership, community } from "@/db/schema";

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
  | "post.delete";

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
};

// ── Core permission check ───────────────────────────────────────────

async function getInheritedRole(
  userId: string,
  communityId: string,
  depth: number,
): Promise<CommunityRole | null> {
  if (depth <= 0) return null;

  const mem = await db
    .select({ role: membership.role })
    .from(membership)
    .where(
      and(
        eq(membership.userId, userId),
        eq(membership.communityId, communityId),
        eq(membership.status, "active"),
      ),
    )
    .limit(1);

  if (mem.length > 0) {
    const role = mem[0].role as CommunityRole;
    if (ROLE_WEIGHT[role] >= ROLE_WEIGHT.moderator) return role;
  }

  const comm = await db
    .select({ parentId: community.parentId })
    .from(community)
    .where(eq(community.id, communityId))
    .limit(1);

  if (comm[0]?.parentId) {
    return getInheritedRole(userId, comm[0].parentId, depth - 1);
  }

  return null;
}

export async function getEffectiveRole(
  userId: string,
  communityId: string,
): Promise<CommunityRole | null> {
  // Check platform admin
  const userRow = await db
    .select({ isPlatformAdmin: user.isPlatformAdmin })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (userRow[0]?.isPlatformAdmin) return "admin";

  // Check direct membership
  const mem = await db
    .select({ role: membership.role })
    .from(membership)
    .where(
      and(
        eq(membership.userId, userId),
        eq(membership.communityId, communityId),
        eq(membership.status, "active"),
      ),
    )
    .limit(1);

  if (mem.length > 0) return mem[0].role as CommunityRole;

  // Check parent chain for cascading admin/mod roles
  const comm = await db
    .select({ parentId: community.parentId })
    .from(community)
    .where(eq(community.id, communityId))
    .limit(1);

  if (comm[0]?.parentId) {
    return getInheritedRole(userId, comm[0].parentId, 4);
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
