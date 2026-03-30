import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Newspaper } from "lucide-react";
import { getSession } from "@/lib/session";
import { getPersonalFeed } from "@/lib/queries/feed";
import { getReactionCountsBatch } from "@/lib/queries/reaction";
import { getCommentCountsBatch } from "@/lib/queries/comment";
import { getUserCommunities } from "@/lib/queries/membership";
import { PostCard } from "@/components/post-card";
import { BookmarkButton } from "@/components/bookmark-button";
import { FeedLoadMore } from "@/components/feed-load-more";
import { FeedCommunityFilter } from "@/components/feed-community-filter";
import { buttonVariants } from "@/components/ui/button-variants";

export const metadata: Metadata = {
  title: "Feed | Builder Launchpad",
};

interface Props {
  searchParams: Promise<{ community?: string }>;
}

export default async function FeedPage({ searchParams }: Props) {
  const session = await getSession();
  if (!session) redirect("/login");

  const sp = await searchParams;
  const selectedCommunityId = sp.community ?? null;

  const communities = await getUserCommunities(session.user.id);

  if (communities.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="flex items-center gap-2 mb-6">
          <Newspaper className="h-5 w-5" />
          <h1 className="text-lg font-semibold">Feed</h1>
        </div>
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Join a community to see content here.
          </p>
          <Link
            href="/communities"
            className={buttonVariants({ size: "sm", className: "mt-3" })}
          >
            Discover communities
          </Link>
        </div>
      </div>
    );
  }

  const { posts, nextCursor } = await getPersonalFeed(session.user.id, {
    limit: 20,
    communityId: selectedCommunityId ?? undefined,
  });

  const postIds = posts.map((p) => p.id);
  const [reactionCountsMap, commentCountsMap] = await Promise.all([
    getReactionCountsBatch("post", postIds),
    getCommentCountsBatch(postIds),
  ]);

  const cursorString = nextCursor
    ? `${nextCursor.publishedAt}|${nextCursor.id}`
    : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center gap-2 mb-4">
        <Newspaper className="h-5 w-5" />
        <h1 className="text-lg font-semibold">Feed</h1>
      </div>

      {/* Community filter */}
      <div className="mb-4">
        <FeedCommunityFilter
          communities={communities}
          selected={selectedCommunityId}
        />
      </div>

      {posts.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">
            {selectedCommunityId
              ? "No posts in this community yet."
              : "No posts yet from your communities. Check back soon."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {posts.map((p) => (
            <div key={p.id} className="relative">
              <PostCard
                title={p.title}
                slug={p.slug}
                communitySlug={p.communitySlug}
                communityName={selectedCommunityId ? undefined : p.communityName}
                authorName={p.authorDisplayName}
                authorUsername={p.authorUsername}
                authorAvatarUrl={p.authorAvatarUrl}
                publishedAt={p.publishedAt}
                tags={(p.tags as string[]) ?? []}
                excerpt={p.excerpt}
                reactionCounts={reactionCountsMap.get(p.id)}
                commentCount={commentCountsMap.get(p.id)}
              />
              <div className="absolute right-3 top-3">
                <BookmarkButton
                  targetType="post"
                  targetId={p.id}
                  bookmarked={false}
                />
              </div>
            </div>
          ))}

          <FeedLoadMore
            initialCursor={cursorString}
            communityId={selectedCommunityId}
          />
        </div>
      )}
    </div>
  );
}
