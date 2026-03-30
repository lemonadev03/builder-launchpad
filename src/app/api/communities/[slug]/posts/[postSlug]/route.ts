import { NextResponse } from "next/server";
import { getApiSession, requireApiAuth } from "@/lib/api-auth";
import { checkPostUpdateRateLimit } from "@/lib/rate-limit";
import { hasPermission } from "@/lib/permissions";
import { getCommunityBySlug } from "@/lib/queries/community";
import { getMembership } from "@/lib/queries/membership";
import { getPostBySlug, updatePost, archivePost } from "@/lib/queries/post";
import { updatePostSchema } from "@/lib/validations/post";
import { validatePostContent } from "@/lib/tiptap";
import type { TiptapContent } from "@/lib/tiptap";

interface Props {
  params: Promise<{ slug: string; postSlug: string }>;
}

export async function GET(request: Request, { params }: Props) {
  const { slug, postSlug } = await params;
  const c = await getCommunityBySlug(slug);
  if (!c || c.archivedAt) {
    return NextResponse.json(
      { error: "Not found" },
      { status: 404 },
    );
  }

  // Unlisted community check
  if (c.visibility === "unlisted") {
    const session = await getApiSession(request);
    if (!session) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const mem = await getMembership(session.user.id, c.id);
    if (!mem || mem.status !== "active") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }

  const p = await getPostBySlug(slug, postSlug);
  if (!p) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Drafts only visible to author
  if (p.status === "draft") {
    const session = await getApiSession(request);
    if (!session || session.user.id !== p.authorId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }

  return NextResponse.json({ post: p });
}

export async function PUT(request: Request, { params }: Props) {
  const { slug, postSlug } = await params;
  const { session, response } = await requireApiAuth(request);
  if (response) return response;

  const c = await getCommunityBySlug(slug);
  if (!c) {
    return NextResponse.json(
      { error: "Community not found" },
      { status: 404 },
    );
  }

  const p = await getPostBySlug(slug, postSlug);
  if (!p) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  // Only author can edit
  if (p.authorId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rateCheck = checkPostUpdateRateLimit(session.user.id);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: "Too many updates. Please try again later." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON" },
      { status: 400 },
    );
  }

  const parsed = updatePostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  if (parsed.data.content) {
    const contentValidation = validatePostContent(
      parsed.data.content as TiptapContent,
    );
    if (!contentValidation.valid) {
      return NextResponse.json(
        { error: contentValidation.error },
        { status: 400 },
      );
    }
  }

  const updated = await updatePost(p.id, parsed.data);
  if (!updated) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  return NextResponse.json({ post: updated });
}

export async function DELETE(request: Request, { params }: Props) {
  const { slug, postSlug } = await params;
  const { session, response } = await requireApiAuth(request);
  if (response) return response;

  const c = await getCommunityBySlug(slug);
  if (!c) {
    return NextResponse.json(
      { error: "Community not found" },
      { status: 404 },
    );
  }

  const p = await getPostBySlug(slug, postSlug);
  if (!p) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  // Author can delete their own. Moderator+ can delete any.
  const isAuthor = p.authorId === session.user.id;
  if (!isAuthor) {
    const canDelete = await hasPermission(
      session.user.id,
      c.id,
      "post.delete",
    );
    if (!canDelete) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const archived = await archivePost(p.id);
  if (!archived) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  return NextResponse.json({ post: archived });
}
