import { NextResponse } from "next/server";
import { getApiSession, requireApiAuth } from "@/lib/api-auth";
import { checkReactionRateLimit } from "@/lib/rate-limit";
import { reactionSchema } from "@/lib/validations/reaction";
import {
  addReaction,
  removeReaction,
  getReactionCounts,
  getUserReactions,
} from "@/lib/queries/reaction";

export async function POST(request: Request) {
  const { session, response } = await requireApiAuth(request);
  if (response) return response;

  const rateCheck = checkReactionRateLimit(session.user.id);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: "Too many reactions. Please slow down." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = reactionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { targetType, targetId, reactionType } = parsed.data;
  const created = await addReaction(
    session.user.id,
    targetType,
    targetId,
    reactionType,
  );

  const counts = await getReactionCounts(targetType, targetId);
  const userReactions = await getUserReactions(
    session.user.id,
    targetType,
    targetId,
  );

  return NextResponse.json(
    { reaction: created, counts, userReactions },
    { status: created ? 201 : 200 },
  );
}

export async function DELETE(request: Request) {
  const { session, response } = await requireApiAuth(request);
  if (response) return response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = reactionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { targetType, targetId, reactionType } = parsed.data;
  await removeReaction(session.user.id, targetType, targetId, reactionType);

  const counts = await getReactionCounts(targetType, targetId);
  const userReactions = await getUserReactions(
    session.user.id,
    targetType,
    targetId,
  );

  return NextResponse.json({ counts, userReactions });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const targetType = url.searchParams.get("targetType") as
    | "post"
    | "comment"
    | null;
  const targetId = url.searchParams.get("targetId");

  if (!targetType || !targetId) {
    return NextResponse.json(
      { error: "targetType and targetId are required" },
      { status: 400 },
    );
  }

  const counts = await getReactionCounts(targetType, targetId);

  // Include user's reactions if authenticated
  const session = await getApiSession(request);
  const userReactions = session
    ? await getUserReactions(session.user.id, targetType, targetId)
    : [];

  return NextResponse.json({ counts, userReactions });
}
