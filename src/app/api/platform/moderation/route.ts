import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireApiAuth } from "@/lib/api-auth";
import { db } from "@/db";
import { post } from "@/db/schema";
import { getCommentById, softDeleteComment } from "@/lib/queries/comment";
import { getPostById, archivePost } from "@/lib/queries/post";
import { isPlatformAdminUser } from "@/lib/platform-admin";
import {
  dismissFlags,
  hideComment,
  hidePost,
  logModerationAction,
  resolveFlags,
} from "@/lib/queries/moderation";
import { platformModerationActionSchema } from "@/lib/validations/platform-moderation";

export async function POST(request: Request) {
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

  const parsed = platformModerationActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { action, targetId, targetType, reason } = parsed.data;

  if (targetType === "post") {
    const targetPost = await getPostById(targetId);
    if (!targetPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (action === "hide") {
      await hidePost(targetId, session.user.id);
      await resolveFlags("post", targetId, session.user.id);
      await logModerationAction({
        action: "hide_post",
        moderatorId: session.user.id,
        targetType: "post",
        targetId,
        targetUserId: targetPost.authorId,
        reason,
        communityId: targetPost.communityId,
      });

      return NextResponse.json({ success: true, action: "hidden" });
    }

    if (action === "delete") {
      await archivePost(targetId);
      await resolveFlags("post", targetId, session.user.id);
      await logModerationAction({
        action: "delete_post",
        moderatorId: session.user.id,
        targetType: "post",
        targetId,
        targetUserId: targetPost.authorId,
        reason,
        communityId: targetPost.communityId,
      });

      return NextResponse.json({ success: true, action: "deleted" });
    }

    await dismissFlags("post", targetId, session.user.id);
    await logModerationAction({
      action: "dismiss_flags",
      moderatorId: session.user.id,
      targetType: "post",
      targetId,
      targetUserId: targetPost.authorId,
      reason,
      communityId: targetPost.communityId,
    });

    return NextResponse.json({ success: true, action: "dismissed" });
  }

  const targetComment = await getCommentById(targetId);
  if (!targetComment || targetComment.deletedAt) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }

  const [commentPost] = await db
    .select({
      communityId: post.communityId,
    })
    .from(post)
    .where(eq(post.id, targetComment.postId))
    .limit(1);

  if (!commentPost) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }

  if (action === "hide") {
    await hideComment(targetId, session.user.id);
    await resolveFlags("comment", targetId, session.user.id);
    await logModerationAction({
      action: "hide_comment",
      moderatorId: session.user.id,
      targetType: "comment",
      targetId,
      targetUserId: targetComment.authorId,
      reason,
      communityId: commentPost.communityId,
    });

    return NextResponse.json({ success: true, action: "hidden" });
  }

  if (action === "delete") {
    await softDeleteComment(targetId);
    await resolveFlags("comment", targetId, session.user.id);
    await logModerationAction({
      action: "delete_comment",
      moderatorId: session.user.id,
      targetType: "comment",
      targetId,
      targetUserId: targetComment.authorId,
      reason,
      communityId: commentPost.communityId,
    });

    return NextResponse.json({ success: true, action: "deleted" });
  }

  await dismissFlags("comment", targetId, session.user.id);
  await logModerationAction({
    action: "dismiss_flags",
    moderatorId: session.user.id,
    targetType: "comment",
    targetId,
    targetUserId: targetComment.authorId,
    reason,
    communityId: commentPost.communityId,
  });

  return NextResponse.json({ success: true, action: "dismissed" });
}
