import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/api-auth";
import { getCommunityBySlug } from "@/lib/queries/community";
import { requireCommunityPermission } from "@/lib/permissions";
import {
  getMembership,
  warnMember,
  suspendMember,
  unsuspendMember,
} from "@/lib/queries/membership";
import { logModerationAction } from "@/lib/queries/moderation";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { membership } from "@/db/schema";

const memberActionSchema = z.object({
  action: z.enum(["warn", "suspend", "unsuspend", "remove"]),
  userId: z.string().min(1),
  reason: z.string().max(500).optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const { session, response } = await requireApiAuth(request);
  if (response) return response;

  const community = await getCommunityBySlug(slug);
  if (!community) {
    return NextResponse.json(
      { error: "Community not found" },
      { status: 404 },
    );
  }

  const permCheck = await requireCommunityPermission(
    session.user.id,
    community.id,
    "content.moderate",
  );
  if (permCheck) return permCheck;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = memberActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { action, userId, reason } = parsed.data;

  // Prevent self-moderation
  if (userId === session.user.id) {
    return NextResponse.json(
      { error: "You cannot moderate yourself." },
      { status: 400 },
    );
  }

  const mem = await getMembership(userId, community.id);
  if (!mem) {
    return NextResponse.json(
      { error: "Member not found in this community." },
      { status: 404 },
    );
  }

  switch (action) {
    case "warn": {
      await warnMember(mem.id);
      await logModerationAction({
        action: "warn_member",
        moderatorId: session.user.id,
        targetType: "member",
        targetId: mem.id,
        targetUserId: userId,
        reason,
        communityId: community.id,
      });
      return NextResponse.json({ success: true, action: "warned" });
    }

    case "suspend": {
      if (mem.status !== "active") {
        return NextResponse.json(
          { error: "Member is not active." },
          { status: 400 },
        );
      }
      await suspendMember(mem.id);
      await logModerationAction({
        action: "suspend_member",
        moderatorId: session.user.id,
        targetType: "member",
        targetId: mem.id,
        targetUserId: userId,
        reason,
        communityId: community.id,
      });
      return NextResponse.json({ success: true, action: "suspended" });
    }

    case "unsuspend": {
      if (mem.status !== "suspended") {
        return NextResponse.json(
          { error: "Member is not suspended." },
          { status: 400 },
        );
      }
      await unsuspendMember(mem.id);
      await logModerationAction({
        action: "unsuspend_member",
        moderatorId: session.user.id,
        targetType: "member",
        targetId: mem.id,
        targetUserId: userId,
        reason,
        communityId: community.id,
      });
      return NextResponse.json({ success: true, action: "unsuspended" });
    }

    case "remove": {
      await db.delete(membership).where(eq(membership.id, mem.id));
      await logModerationAction({
        action: "remove_member",
        moderatorId: session.user.id,
        targetType: "member",
        targetId: mem.id,
        targetUserId: userId,
        reason,
        communityId: community.id,
      });
      return NextResponse.json({ success: true, action: "removed" });
    }
  }
}
