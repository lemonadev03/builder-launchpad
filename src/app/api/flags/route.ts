import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { flagSchema } from "@/lib/validations/flag";
import { checkFlagRateLimit } from "@/lib/rate-limit";
import { getPostById } from "@/lib/queries/post";
import { getCommentById } from "@/lib/queries/comment";
import { createFlag, hasUserFlagged, getFlagCount } from "@/lib/queries/flag";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { post } from "@/db/schema";

export async function POST(request: Request) {
  const { session, response } = await requireApiAuth(request);
  if (response) return response;

  // Rate limit
  const rateCheck = checkFlagRateLimit(session.user.id);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: "Too many flags. Please try again later." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = flagSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { targetType, targetId, reason, description } = parsed.data;

  // Check duplicate
  const alreadyFlagged = await hasUserFlagged(
    session.user.id,
    targetType,
    targetId,
  );
  if (alreadyFlagged) {
    return NextResponse.json(
      { error: "You have already flagged this content." },
      { status: 409 },
    );
  }

  // Resolve communityId from target
  let communityId: string | null = null;

  if (targetType === "post") {
    const p = await getPostById(targetId);
    if (!p) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    communityId = p.communityId;
  } else {
    const c = await getCommentById(targetId);
    if (!c) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 },
      );
    }
    // Get communityId via the comment's post
    const [postRow] = await db
      .select({ communityId: post.communityId })
      .from(post)
      .where(eq(post.id, c.postId))
      .limit(1);
    communityId = postRow?.communityId ?? null;
  }

  if (!communityId) {
    return NextResponse.json(
      { error: "Could not resolve community" },
      { status: 400 },
    );
  }

  // Prevent self-flagging
  if (targetType === "post") {
    const p = await getPostById(targetId);
    if (p?.authorId === session.user.id) {
      return NextResponse.json(
        { error: "You cannot flag your own content." },
        { status: 400 },
      );
    }
  }

  const created = await createFlag(
    session.user.id,
    targetType,
    targetId,
    reason,
    communityId,
    description,
  );

  return NextResponse.json({ flag: created, flagged: true }, { status: 201 });
}

export async function GET(request: Request) {
  const { session, response } = await requireApiAuth(request);
  if (response) return response;

  const url = new URL(request.url);
  const targetType = url.searchParams.get("targetType") as
    | "post"
    | "comment"
    | null;
  const targetId = url.searchParams.get("targetId");

  if (targetType && targetId) {
    const flagged = await hasUserFlagged(
      session.user.id,
      targetType,
      targetId,
    );
    const flagCount = await getFlagCount(targetType, targetId);
    return NextResponse.json({ flagged, flagCount });
  }

  return NextResponse.json({ error: "Missing targetType or targetId" }, { status: 400 });
}
