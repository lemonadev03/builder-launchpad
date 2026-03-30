import { NextResponse } from "next/server";
import { getApiSession, requireApiAuth } from "@/lib/api-auth";
import {
  checkPostCreateRateLimit,
} from "@/lib/rate-limit";
import { requireCommunityPermission } from "@/lib/permissions";
import { getCommunityBySlug } from "@/lib/queries/community";
import { getMembership } from "@/lib/queries/membership";
import {
  createPost,
  getDraftCountByUser,
  getPostCountTodayByUser,
  getPublishedPostsByCommunity,
} from "@/lib/queries/post";
import { createPostSchema } from "@/lib/validations/post";
import { validatePostContent } from "@/lib/tiptap";
import type { TiptapContent } from "@/lib/tiptap";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function POST(request: Request, { params }: Props) {
  const { slug } = await params;
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
    "post.create",
  );
  if (forbidden) return forbidden;

  const rateCheck = checkPostCreateRateLimit(session.user.id);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: "Too many posts. Please try again later." },
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

  const parsed = createPostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  // Validate content
  const contentValidation = validatePostContent(
    parsed.data.content as TiptapContent,
  );
  if (!contentValidation.valid) {
    return NextResponse.json(
      { error: contentValidation.error },
      { status: 400 },
    );
  }

  // Anti-abuse checks
  if (parsed.data.status === "draft") {
    const draftCount = await getDraftCountByUser(session.user.id);
    if (draftCount >= 20) {
      return NextResponse.json(
        { error: "Maximum 20 drafts allowed. Please publish or delete existing drafts." },
        { status: 400 },
      );
    }
  }

  const todayCount = await getPostCountTodayByUser(session.user.id);
  if (todayCount >= 10) {
    return NextResponse.json(
      { error: "Maximum 10 posts per day." },
      { status: 429 },
    );
  }

  // Override communityId with the resolved one
  const result = await createPost(session.user.id, {
    ...parsed.data,
    communityId: c.id,
  });

  return NextResponse.json({ post: result }, { status: 201 });
}

export async function GET(request: Request, { params }: Props) {
  const { slug } = await params;
  const c = await getCommunityBySlug(slug);
  if (!c || c.archivedAt) {
    return NextResponse.json(
      { error: "Community not found" },
      { status: 404 },
    );
  }

  // Unlisted community: require auth + membership
  if (c.visibility === "unlisted") {
    const session = await getApiSession(request);
    if (!session) {
      return NextResponse.json(
        { error: "Community not found" },
        { status: 404 },
      );
    }
    const mem = await getMembership(session.user.id, c.id);
    if (!mem || mem.status !== "active") {
      return NextResponse.json(
        { error: "Community not found" },
        { status: 404 },
      );
    }
  }

  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const limit = Math.min(
    50,
    Math.max(1, parseInt(url.searchParams.get("limit") ?? "20", 10)),
  );
  const offset = (page - 1) * limit;

  const { posts, total } = await getPublishedPostsByCommunity(c.id, {
    limit,
    offset,
  });

  return NextResponse.json({ posts, total, page, limit });
}
