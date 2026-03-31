import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getCommunityBySlug } from "@/lib/queries/community";
import {
  getPublishedPostsByCommunity,
  getTagsByCommunity,
} from "@/lib/queries/post";
import { getMembership } from "@/lib/queries/membership";
import { getReactionCountsBatch } from "@/lib/queries/reaction";
import { getCommentCountsBatch } from "@/lib/queries/comment";
import { getSession } from "@/lib/session";
import { PostCard } from "@/components/post-card";
import { TagFilter } from "@/components/tag-filter";
import { Pagination } from "@/components/pagination";
import { buttonVariants } from "@/components/ui/button-variants";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; tag?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = await getCommunityBySlug(slug);
  if (!c) return { title: "Community Not Found | Builder Launchpad" };

  return {
    title: `Posts - ${c.name} | Builder Launchpad`,
    description: `Blog posts from ${c.name} on Builder Launchpad`,
  };
}

export default async function CommunityPostsPage({
  params,
  searchParams,
}: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const session = await getSession();

  const c = await getCommunityBySlug(slug);
  if (!c || c.archivedAt) notFound();

  // Unlisted community check
  if (c.visibility === "unlisted") {
    if (!session) notFound();
    const mem = await getMembership(session.user.id, c.id);
    if (!mem || mem.status !== "active") notFound();
  }

  const page = Math.max(1, parseInt(sp.page ?? "1", 10));
  const limit = 20;
  const offset = (page - 1) * limit;
  const tag = sp.tag ?? undefined;

  const [{ posts, total }, tags, isMember] = await Promise.all([
    getPublishedPostsByCommunity(c.id, { limit, offset, tag }),
    getTagsByCommunity(c.id),
    session
      ? getMembership(session.user.id, c.id).then(
          (m) => m?.status === "active",
        )
      : Promise.resolve(false),
  ]);

  const postIds = posts.map((p) => p.id);
  const [reactionCountsMap, commentCountsMap] = await Promise.all([
    getReactionCountsBatch("post", postIds),
    getCommentCountsBatch(postIds),
  ]);

  const totalPages = Math.ceil(total / limit);
  const basePath = `/communities/${slug}/posts`;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Posts</h1>
          <p className="text-sm text-muted-foreground">
            {total} {total === 1 ? "post" : "posts"} in {c.name}
          </p>
        </div>
        {isMember && (
          <Link
            href={`/posts/new?community=${slug}`}
            className={buttonVariants({ size: "sm" })}
          >
            Write a post
          </Link>
        )}
      </div>

      {/* Tag filter */}
      <div className="mb-4">
        <TagFilter tags={tags} selected={tag ?? null} basePath={basePath} />
      </div>

      {/* Posts */}
      {posts.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {tag ? `No posts tagged "${tag}".` : "No posts yet."}
        </p>
      ) : (
        <div className="space-y-2">
          {posts.map((p) => (
            <PostCard
              key={p.id}
              title={p.title}
              slug={p.slug}
              communitySlug={slug}
              authorName={p.authorDisplayName}
              authorAvatarUrl={p.authorAvatarUrl}
              publishedAt={p.publishedAt}
              tags={(p.tags as string[]) ?? []}
              excerpt={p.excerpt}
              reactionCounts={reactionCountsMap.get(p.id)}
              commentCount={commentCountsMap.get(p.id)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="mt-6">
        <Pagination
          page={page}
          totalPages={totalPages}
          basePath={basePath}
          searchParams={tag ? { tag } : {}}
        />
      </div>
    </div>
  );
}
