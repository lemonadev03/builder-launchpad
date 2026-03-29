import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { hasPermission } from "@/lib/permissions";
import { getCommunityBySlug } from "@/lib/queries/community";
import { getPostBySlug } from "@/lib/queries/post";
import {
  getCommentById,
  updateComment,
  softDeleteComment,
} from "@/lib/queries/comment";
import { updateCommentSchema } from "@/lib/validations/comment";
import { validateCommentContent } from "@/lib/tiptap";
import type { TiptapContent } from "@/lib/tiptap";

interface Props {
  params: Promise<{ slug: string; postSlug: string; commentId: string }>;
}

export async function PUT(request: Request, { params }: Props) {
  const { slug, postSlug, commentId } = await params;
  const { session, response } = await requireApiAuth(request);
  if (response) return response;

  const c = await getCommunityBySlug(slug);
  if (!c) {
    return NextResponse.json({ error: "Community not found" }, { status: 404 });
  }

  const p = await getPostBySlug(slug, postSlug);
  if (!p) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const existing = await getCommentById(commentId);
  if (!existing || existing.postId !== p.id || existing.deletedAt) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }

  if (existing.authorId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateCommentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const contentValidation = validateCommentContent(
    parsed.data.content as TiptapContent,
  );
  if (!contentValidation.valid) {
    return NextResponse.json(
      { error: contentValidation.error },
      { status: 400 },
    );
  }

  const updated = await updateComment(commentId, parsed.data.content);
  if (!updated) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }

  return NextResponse.json({ comment: updated });
}

export async function DELETE(request: Request, { params }: Props) {
  const { slug, postSlug, commentId } = await params;
  const { session, response } = await requireApiAuth(request);
  if (response) return response;

  const c = await getCommunityBySlug(slug);
  if (!c) {
    return NextResponse.json({ error: "Community not found" }, { status: 404 });
  }

  const p = await getPostBySlug(slug, postSlug);
  if (!p) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const existing = await getCommentById(commentId);
  if (!existing || existing.postId !== p.id || existing.deletedAt) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }

  const isAuthor = existing.authorId === session.user.id;
  if (!isAuthor) {
    const canDelete = await hasPermission(
      session.user.id,
      c.id,
      "comment.delete",
    );
    if (!canDelete) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const deleted = await softDeleteComment(commentId);
  if (!deleted) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }

  return NextResponse.json({ comment: deleted });
}
