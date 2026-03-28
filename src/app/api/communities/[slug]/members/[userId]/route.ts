import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/api-auth";
import { getCommunityBySlug } from "@/lib/queries/community";
import {
  getMembership,
  updateMemberRole,
  removeMember,
  getAdminCount,
  suspendMember,
  unsuspendMember,
  leaveCommunity,
} from "@/lib/queries/membership";
import { requireCommunityPermission } from "@/lib/permissions";

interface Props {
  params: Promise<{ slug: string; userId: string }>;
}

const updateSchema = z.object({
  role: z.enum(["admin", "moderator", "member"]).optional(),
  action: z.enum(["suspend", "unsuspend"]).optional(),
});

export async function PUT(request: Request, { params }: Props) {
  const { slug, userId: targetUserId } = await params;
  const { session, response } = await requireApiAuth(request);
  if (response) return response;

  const c = await getCommunityBySlug(slug);
  if (!c) {
    return NextResponse.json(
      { error: "Community not found" },
      { status: 404 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  // Handle suspend/unsuspend
  if (parsed.data.action) {
    const forbidden = await requireCommunityPermission(
      session.user.id,
      c.id,
      "community.manage_members",
    );
    if (forbidden) return forbidden;

    if (targetUserId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot suspend yourself" },
        { status: 400 },
      );
    }

    const mem = await getMembership(targetUserId, c.id);
    if (!mem) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 },
      );
    }

    if (parsed.data.action === "suspend") {
      if (mem.status !== "active") {
        return NextResponse.json(
          { error: "Member is not active" },
          { status: 400 },
        );
      }
      const updated = await suspendMember(mem.id);
      return NextResponse.json({ membership: updated });
    }

    // unsuspend
    if (mem.status !== "suspended") {
      return NextResponse.json(
        { error: "Member is not suspended" },
        { status: 400 },
      );
    }
    const updated = await unsuspendMember(mem.id);
    return NextResponse.json({ membership: updated });
  }

  // Handle role change
  if (parsed.data.role) {
    const forbidden = await requireCommunityPermission(
      session.user.id,
      c.id,
      "member.change_role",
    );
    if (forbidden) return forbidden;

    if (targetUserId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot change your own role" },
        { status: 400 },
      );
    }

    const mem = await getMembership(targetUserId, c.id);
    if (!mem || mem.status !== "active") {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 },
      );
    }

    // Prevent demoting the last admin
    if (mem.role === "admin" && parsed.data.role !== "admin") {
      const adminCount = await getAdminCount(c.id);
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: "Cannot demote the last admin" },
          { status: 400 },
        );
      }
    }

    const updated = await updateMemberRole(mem.id, parsed.data.role);
    return NextResponse.json({ membership: updated });
  }

  return NextResponse.json({ error: "No action specified" }, { status: 400 });
}

export async function DELETE(request: Request, { params }: Props) {
  const { slug, userId: targetUserId } = await params;
  const { session, response } = await requireApiAuth(request);
  if (response) return response;

  const c = await getCommunityBySlug(slug);
  if (!c) {
    return NextResponse.json(
      { error: "Community not found" },
      { status: 404 },
    );
  }

  // Self-leave: any member can leave
  if (targetUserId === session.user.id) {
    const result = await leaveCommunity(session.user.id, c.id);
    if (result.error === "not_member") {
      return NextResponse.json(
        { error: "Not a member" },
        { status: 404 },
      );
    }
    if (result.error === "last_admin") {
      return NextResponse.json(
        { error: "Cannot leave as the last admin" },
        { status: 400 },
      );
    }
    return NextResponse.json({ message: "Left community" });
  }

  // Admin removing another member
  const forbidden = await requireCommunityPermission(
    session.user.id,
    c.id,
    "member.remove",
  );
  if (forbidden) return forbidden;

  const mem = await getMembership(targetUserId, c.id);
  if (!mem || mem.status !== "active") {
    return NextResponse.json(
      { error: "Member not found" },
      { status: 404 },
    );
  }

  // Prevent removing the last admin
  if (mem.role === "admin") {
    const adminCount = await getAdminCount(c.id);
    if (adminCount <= 1) {
      return NextResponse.json(
        { error: "Cannot remove the last admin" },
        { status: 400 },
      );
    }
  }

  const removed = await removeMember(mem.id);
  return NextResponse.json({ membership: removed });
}
