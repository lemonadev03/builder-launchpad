import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Bookmark } from "lucide-react";
import { getSession } from "@/lib/session";
import { getUserBookmarks } from "@/lib/queries/bookmark";
import { PostCard } from "@/components/post-card";
import { Pagination } from "@/components/pagination";

export const metadata: Metadata = {
  title: "Bookmarks | Builder Launchpad",
};

interface Props {
  searchParams: Promise<{ page?: string }>;
}

export default async function BookmarksPage({ searchParams }: Props) {
  const session = await getSession();
  if (!session) redirect("/login");

  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10));
  const limit = 20;
  const offset = (page - 1) * limit;

  const { bookmarks, total } = await getUserBookmarks(session.user.id, {
    limit,
    offset,
  });

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center gap-2">
        <Bookmark className="h-5 w-5" />
        <h1 className="text-lg font-semibold">Bookmarks</h1>
        <span className="text-sm text-muted-foreground">({total})</span>
      </div>

      {bookmarks.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No bookmarks yet. Save posts to find them here later.
        </div>
      ) : (
        <div className="space-y-2">
          {bookmarks.map((b) => (
            <PostCard
              key={b.bookmarkId}
              title={b.postTitle}
              slug={b.postSlug}
              communitySlug={b.communitySlug}
              authorName={b.authorDisplayName}
              authorUsername={b.authorUsername}
              authorAvatarUrl={b.authorAvatarUrl}
              publishedAt={b.postPublishedAt}
              tags={(b.postTags as string[]) ?? []}
              excerpt={b.postExcerpt}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            page={page}
            totalPages={totalPages}
            basePath="/bookmarks"
          />
        </div>
      )}
    </div>
  );
}
