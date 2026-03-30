import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/api-auth";
import { getCommunityBySlug } from "@/lib/queries/community";
import { getAllDescendants } from "@/lib/queries/community-tree";
import { requireCommunityPermission } from "@/lib/permissions";
import { getPostById } from "@/lib/queries/post";
import { getCommentById } from "@/lib/queries/comment";
import { archivePost } from "@/lib/queries/post";
import { softDeleteComment } from "@/lib/queries/comment";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { post } from "@/db/schema";
import {
  hidePost,
  unhidePost,
  hideComment,
  unhideComment,
  dismissFlags,
  resolveFlags,
  logModerationAction,
} from "@/lib/queries/moderation";

const actionSchema = z.object({
  action: z.enum([
    "hide",
    "unhide",
    "delete",
    "dismiss_flags",
  ]),
  targetType: z.enum(["post", "comment"]),
  targetId: z.string().min(1),
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

  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { action, targetType, targetId, reason } = parsed.data;

  // Verify target exists and belongs to this community (or its descendants)
  const descendants = await getAllDescendants(community.id);
  const allowedCommunityIds = new Set([
    community.id,
    ...descendants.map((d) => d.id),
  ]);

  if (targetType === "post") {
    const p = await getPostById(targetId);
    if (!p) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    if (!allowedCommunityIds.has(p.communityId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else {
    const c = await getCommentById(targetId);
    if (!c) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 },
      );
    }
    // Check community via the comment's post
    const [postRow] = await db
      .select({ communityId: post.communityId })
      .from(post)
      .where(eq(post.id, c.postId))
      .limit(1);
    if (!postRow || !allowedCommunityIds.has(postRow.communityId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  switch (action) {
    case "hide": {
      if (targetType === "post") {
        await hidePost(targetId, session.user.id);
        await resolveFlags("post", targetId, session.user.id);
        await logModerationAction({
          action: "hide_post",
          moderatorId: session.user.id,
          targetType: "post",
          targetId,
          reason,
          communityId: community.id,
        });
      } else {
        await hideComment(targetId, session.user.id);
        await resolveFlags("comment", targetId, session.user.id);
        await logModerationAction({
          action: "hide_comment",
          moderatorId: session.user.id,
          targetType: "comment",
          targetId,
          reason,
          communityId: community.id,
        });
      }
      return NextResponse.json({ success: true, action: "hidden" });
    }

    case "unhide": {
      if (targetType === "post") {
        await unhidePost(targetId);
        await logModerationAction({
          action: "unhide_post",
          moderatorId: session.user.id,
          targetType: "post",
          targetId,
          reason,
          communityId: community.id,
        });
      } else {
        await unhideComment(targetId);
        await logModerationAction({
          action: "unhide_comment",
          moderatorId: session.user.id,
          targetType: "comment",
          targetId,
          reason,
          communityId: community.id,
        });
      }
      return NextResponse.json({ success: true, action: "unhidden" });
    }

    case "delete": {
      if (targetType === "post") {
        await archivePost(targetId);
        await resolveFlags("post", targetId, session.user.id);
        await logModerationAction({
          action: "delete_post",
          moderatorId: session.user.id,
          targetType: "post",
          targetId,
          reason,
          communityId: community.id,
        });
      } else {
        await softDeleteComment(targetId);
        await resolveFlags("comment", targetId, session.user.id);
        await logModerationAction({
          action: "delete_comment",
          moderatorId: session.user.id,
          targetType: "comment",
          targetId,
          reason,
          communityId: community.id,
        });
      }
      return NextResponse.json({ success: true, action: "deleted" });
    }

    case "dismiss_flags": {
      await dismissFlags(targetType, targetId, session.user.id);
      await logModerationAction({
        action: "dismiss_flags",
        moderatorId: session.user.id,
        targetType,
        targetId,
        reason,
        communityId: community.id,
      });
      return NextResponse.json({ success: true, action: "dismissed" });
    }
  }
}
