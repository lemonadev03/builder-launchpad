import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { isPlatformAdminUser } from "@/lib/platform-admin";
import { logModerationAction } from "@/lib/queries/moderation";
import {
  getPlatformUserById,
  softDeletePlatformUser,
  suspendPlatformUser,
  unsuspendPlatformUser,
} from "@/lib/queries/platform-user";
import { platformUserActionSchema } from "@/lib/validations/platform-user";

interface Props {
  params: Promise<{ userId: string }>;
}

export async function PATCH(request: Request, { params }: Props) {
  const { userId } = await params;
  const { session, response } = await requireApiAuth(request);
  if (response) return response;

  const allowed = await isPlatformAdminUser(session.user.id);
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = platformUserActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const target = await getPlatformUserById(userId);
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (target.isPlatformAdmin) {
    return NextResponse.json(
      { error: "Platform admins cannot be moderated from this tool" },
      { status: 400 },
    );
  }

  if (target.deletedAt) {
    return NextResponse.json(
      { error: "Deleted users cannot be modified" },
      { status: 400 },
    );
  }

  if (parsed.data.action === "warn") {
    await logModerationAction({
      action: "warn_user_platform",
      moderatorId: session.user.id,
      targetType: "user",
      targetId: userId,
      targetUserId: userId,
      reason: parsed.data.reason,
    });

    return NextResponse.json({ success: true });
  }

  if (parsed.data.action === "suspend") {
    if (target.suspendedAt) {
      return NextResponse.json(
        { error: "User is already suspended" },
        { status: 400 },
      );
    }

    const updated = await suspendPlatformUser(userId);
    if (!updated) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await logModerationAction({
      action: "suspend_user_platform",
      moderatorId: session.user.id,
      targetType: "user",
      targetId: userId,
      targetUserId: userId,
      reason: parsed.data.reason,
    });

    return NextResponse.json({ user: updated });
  }

  if (!target.suspendedAt) {
    return NextResponse.json(
      { error: "User is not suspended" },
      { status: 400 },
    );
  }

  const updated = await unsuspendPlatformUser(userId);
  if (!updated) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  await logModerationAction({
    action: "unsuspend_user_platform",
    moderatorId: session.user.id,
    targetType: "user",
    targetId: userId,
    targetUserId: userId,
    reason: parsed.data.reason,
  });

  return NextResponse.json({ user: updated });
}

export async function DELETE(request: Request, { params }: Props) {
  const { userId } = await params;
  const { session, response } = await requireApiAuth(request);
  if (response) return response;

  const allowed = await isPlatformAdminUser(session.user.id);
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const target = await getPlatformUserById(userId);
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (target.isPlatformAdmin) {
    return NextResponse.json(
      { error: "Platform admins cannot be deleted from this tool" },
      { status: 400 },
    );
  }

  if (target.deletedAt) {
    return NextResponse.json(
      { error: "User is already deleted" },
      { status: 400 },
    );
  }

  const updated = await softDeletePlatformUser(userId);
  if (!updated) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  await logModerationAction({
    action: "soft_delete_user_platform",
    moderatorId: session.user.id,
    targetType: "user",
    targetId: userId,
    targetUserId: userId,
  });

  return NextResponse.json({ user: updated });
}
