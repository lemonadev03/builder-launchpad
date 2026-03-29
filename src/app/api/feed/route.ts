import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { getPersonalFeed } from "@/lib/queries/feed";
import { getReactionCountsBatch } from "@/lib/queries/reaction";
import { getCommentCountsBatch } from "@/lib/queries/comment";

export async function GET(request: Request) {
  const { session, response } = await requireApiAuth(request);
  if (response) return response;

  const url = new URL(request.url);
  const limit = Math.min(
    50,
    Math.max(1, parseInt(url.searchParams.get("limit") ?? "20", 10)),
  );

  // Parse compound cursor
  const cursorParam = url.searchParams.get("cursor");
  let cursor: { publishedAt: string; id: string } | undefined;
  if (cursorParam) {
    const [publishedAt, id] = cursorParam.split("|");
    if (publishedAt && id) {
      cursor = { publishedAt, id };
    }
  }

  // Optional community filter
  const communityId = url.searchParams.get("communityId") ?? undefined;

  const { posts, nextCursor } = await getPersonalFeed(session.user.id, {
    limit,
    cursor,
    communityId,
  });

  // Batch-fetch engagement data
  const postIds = posts.map((p) => p.id);
  const [reactionCountsMap, commentCountsMap] = await Promise.all([
    getReactionCountsBatch("post", postIds),
    getCommentCountsBatch(postIds),
  ]);

  const enrichedPosts = posts.map((p) => ({
    ...p,
    reactionCounts: reactionCountsMap.get(p.id) ?? {},
    commentCount: commentCountsMap.get(p.id) ?? 0,
  }));

  return NextResponse.json({
    posts: enrichedPosts,
    nextCursor: nextCursor
      ? `${nextCursor.publishedAt}|${nextCursor.id}`
      : null,
  });
}
