"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/post-card";
import { BookmarkButton } from "@/components/bookmark-button";

interface FeedPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  tags: unknown;
  publishedAt: string | null;
  communityId: string;
  communityName: string;
  communitySlug: string;
  authorDisplayName: string;
  authorUsername: string;
  authorAvatarUrl: string | null;
  reactionCounts: Record<string, number>;
  commentCount: number;
}

interface FeedLoadMoreProps {
  initialCursor: string | null;
}

export function FeedLoadMore({ initialCursor }: FeedLoadMoreProps) {
  const [pages, setPages] = useState<FeedPost[][]>([]);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [isPending, startTransition] = useTransition();

  if (!cursor && pages.length === 0) return null;

  function loadMore() {
    if (!cursor) return;
    startTransition(async () => {
      const res = await fetch(
        `/api/feed?limit=20&cursor=${encodeURIComponent(cursor)}`,
      );
      if (!res.ok) return;
      const data = await res.json();
      setPages((prev) => [...prev, data.posts]);
      setCursor(data.nextCursor);
    });
  }

  return (
    <>
      {pages.map((page) =>
        page.map((p) => (
          <div key={p.id} className="relative">
            <PostCard
              title={p.title}
              slug={p.slug}
              communitySlug={p.communitySlug}
              communityName={p.communityName}
              authorName={p.authorDisplayName}
              authorUsername={p.authorUsername}
              authorAvatarUrl={p.authorAvatarUrl}
              publishedAt={p.publishedAt ? new Date(p.publishedAt) : null}
              tags={(p.tags as string[]) ?? []}
              excerpt={p.excerpt}
              reactionCounts={p.reactionCounts}
              commentCount={p.commentCount}
            />
            <div className="absolute right-3 top-3">
              <BookmarkButton
                targetType="post"
                targetId={p.id}
                bookmarked={false}
              />
            </div>
          </div>
        )),
      )}

      {cursor && (
        <div className="mt-4 text-center">
          <Button
            variant="outline"
            size="sm"
            onClick={loadMore}
            disabled={isPending}
          >
            {isPending ? "Loading..." : "Load more"}
          </Button>
        </div>
      )}
    </>
  );
}
