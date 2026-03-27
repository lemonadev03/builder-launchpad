import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/api-auth";
import { getCommunityBySlug } from "@/lib/queries/community";
import {
  getMembership,
  updateMemberRole,
  removeMember,
  getAdminCount,
} from "@/lib/queries/membership";
import { requireCommunityPermission } from "@/lib/permissions";

interface Props {
  params: Promise<{ slug: string; userId: string }>;
}

const updateRoleSchema = z.object({
  role: z.enum(["admin", "moderator", "member"]),
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

  const forbidden = await requireCommunityPermission(
    session.user.id,
    c.id,
    "member.change_role",
  );
  if (forbidden) return forbidden;

  // No self-promotion
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateRoleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
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
