import { NextResponse } from "next/server";
import { getApiSession, requireApiAuth } from "@/lib/api-auth";
import { checkCommentCreateRateLimit } from "@/lib/rate-limit";
import { requireCommunityPermission } from "@/lib/permissions";
import { getCommunityBySlug } from "@/lib/queries/community";
import { getPostBySlug } from "@/lib/queries/post";
import { getMembership } from "@/lib/queries/membership";
import {
  createComment,
  getCommentById,
  getCommentsByPost,
  getCommentCountTodayByUser,
} from "@/lib/queries/comment";
import { createCommentSchema } from "@/lib/validations/comment";
import { validateCommentContent } from "@/lib/tiptap";
import type { TiptapContent } from "@/lib/tiptap";

interface Props {
  params: Promise<{ slug: string; postSlug: string }>;
}

export async function POST(request: Request, { params }: Props) {
  const { slug, postSlug } = await params;
  const { session, response } = await requireApiAuth(request);
  if (response) return response;

  const c = await getCommunityBySlug(slug);
  if (!c) {
    return NextResponse.json({ error: "Community not found" }, { status: 404 });
  }

  const p = await getPostBySlug(slug, postSlug);
  if (!p || p.status !== "published") {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const forbidden = await requireCommunityPermission(
    session.user.id,
    c.id,
    "comment.create",
  );
  if (forbidden) return forbidden;

  const rateCheck = checkCommentCreateRateLimit(session.user.id);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: "Too many comments. Please try again later." },
      { status: 429 },
    );
  }

  const todayCount = await getCommentCountTodayByUser(session.user.id);
  if (todayCount >= 50) {
    return NextResponse.json(
      { error: "Maximum 50 comments per day." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createCommentSchema.safeParse(body);
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

  // If replying, enforce one-level nesting: parent must be top-level and not deleted
  if (parsed.data.parentCommentId) {
    const parent = await getCommentById(parsed.data.parentCommentId);
    if (!parent || parent.postId !== p.id) {
      return NextResponse.json(
        { error: "Parent comment not found" },
        { status: 404 },
      );
    }
    if (parent.parentCommentId !== null) {
      return NextResponse.json(
        { error: "Cannot reply to a reply. Only top-level comments accept replies." },
        { status: 400 },
      );
    }
    if (parent.deletedAt) {
      return NextResponse.json(
        { error: "Cannot reply to a deleted comment" },
        { status: 400 },
      );
    }
  }

  const created = await createComment(session.user.id, p.id, parsed.data);
  return NextResponse.json({ comment: created }, { status: 201 });
}

export async function GET(request: Request, { params }: Props) {
  const { slug, postSlug } = await params;

  const c = await getCommunityBySlug(slug);
  if (!c || c.archivedAt) {
    return NextResponse.json({ error: "Community not found" }, { status: 404 });
  }

  // Unlisted community: require auth + membership
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
  if (!p || p.status !== "published") {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const limit = Math.min(
    50,
    Math.max(1, parseInt(url.searchParams.get("limit") ?? "20", 10)),
  );
  const sort =
    url.searchParams.get("sort") === "newest" ? "newest" : "oldest";
  const offset = (page - 1) * limit;

  const { comments, total } = await getCommentsByPost(p.id, {
    limit,
    offset,
    sort,
  });

  return NextResponse.json({ comments, total, page, limit });
}
