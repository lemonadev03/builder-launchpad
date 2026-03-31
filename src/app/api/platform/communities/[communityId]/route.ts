import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { isPlatformAdminUser } from "@/lib/platform-admin";
import {
  archiveCommunity,
  deleteCommunity,
  getCommunityById,
  restoreCommunity,
  setCommunityFeatured,
} from "@/lib/queries/community";
import { logModerationAction } from "@/lib/queries/moderation";
import { platformCommunityActionSchema } from "@/lib/validations/platform-community";

interface Props {
  params: Promise<{ communityId: string }>;
}

export async function PATCH(request: Request, { params }: Props) {
  const { communityId } = await params;
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

  const parsed = platformCommunityActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const existing = await getCommunityById(communityId, { includeArchived: true });
  if (!existing) {
    return NextResponse.json(
      { error: "Community not found" },
      { status: 404 },
    );
  }

  // Hard delete — no audit log since the community is gone
  if (parsed.data.action === "delete") {
    const result = await deleteCommunity(existing.id);
    if (!result) {
      return NextResponse.json(
        { error: "Delete failed" },
        { status: 500 },
      );
    }
    return NextResponse.json({ deleted: true, count: result.deleted });
  }

  let updated = existing;
  let auditAction:
    | "archive_community"
    | "restore_community"
    | "feature_community"
    | "unfeature_community"
    | null = null;

  switch (parsed.data.action) {
    case "archive": {
      if (!existing.archivedAt) {
        updated = (await archiveCommunity(existing.id)) ?? existing;
        auditAction = "archive_community";
      }
      break;
    }
    case "restore": {
      if (existing.archivedAt) {
        updated = (await restoreCommunity(existing.id)) ?? existing;
        auditAction = "restore_community";
      }
      break;
    }
    case "feature": {
      if (existing.archivedAt) {
        return NextResponse.json(
          { error: "Archived communities cannot be featured" },
          { status: 400 },
        );
      }

      if (!existing.isFeatured) {
        updated = (await setCommunityFeatured(existing.id, true)) ?? existing;
        auditAction = "feature_community";
      }
      break;
    }
    case "unfeature": {
      if (existing.isFeatured) {
        updated = (await setCommunityFeatured(existing.id, false)) ?? existing;
        auditAction = "unfeature_community";
      }
      break;
    }
  }

  if (auditAction) {
    await logModerationAction({
      action: auditAction,
      moderatorId: session.user.id,
      targetType: "community",
      targetId: existing.id,
      communityId: existing.id,
    });
  }

  return NextResponse.json({ community: updated });
}

