import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";
import { getCommunityBySlug } from "@/lib/queries/community";
import { getAncestorChain } from "@/lib/queries/community-tree";
import { getPostBySlug } from "@/lib/queries/post";
import { getMembership } from "@/lib/queries/membership";
import { getReactionCounts, getUserReactions } from "@/lib/queries/reaction";
import { isBookmarked } from "@/lib/queries/bookmark";
import { getSession } from "@/lib/session";
import { PostAuthorCard } from "@/components/post-author-card";
import { ShareUrl } from "@/components/share-url";
import { ReactionBar } from "@/components/reaction-bar";
import { BookmarkButton } from "@/components/bookmark-button";
import { RichTextRenderer } from "@/components/editor/rich-text-renderer";
import { Badge } from "@/components/ui/badge";
import type { TiptapContent } from "@/lib/tiptap";

interface Props {
  params: Promise<{ slug: string; postSlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, postSlug } = await params;
  const p = await getPostBySlug(slug, postSlug);

  if (!p || p.status !== "published") {
    return { title: "Post Not Found | Builder Launchpad" };
  }

  return {
    title: `${p.title} | Builder Launchpad`,
    description: p.excerpt || `Read ${p.title} on Builder Launchpad`,
    authors: [{ name: p.authorDisplayName }],
    openGraph: {
      title: p.title,
      description: p.excerpt ?? undefined,
      type: "article",
      publishedTime: p.publishedAt?.toISOString(),
      authors: [p.authorDisplayName],
    },
  };
}

export default async function PostPage({ params }: Props) {
  const { slug, postSlug } = await params;
  const session = await getSession();

  const c = await getCommunityBySlug(slug);
  if (!c || c.archivedAt) notFound();

  // Unlisted community: require membership
  if (c.visibility === "unlisted") {
    if (!session) notFound();
    const mem = await getMembership(session.user.id, c.id);
    if (!mem || mem.status !== "active") notFound();
  }

  const p = await getPostBySlug(slug, postSlug);
  if (!p) notFound();

  // Drafts only visible to author
  if (p.status === "draft") {
    if (!session || session.user.id !== p.authorId) notFound();
  }

  const [ancestors, reactionCounts, userReactions, bookmarkedState] =
    await Promise.all([
      c.parentId ? getAncestorChain(c.id) : Promise.resolve([]),
      getReactionCounts("post", p.id),
      session
        ? getUserReactions(session.user.id, "post", p.id)
        : Promise.resolve([]),
      session
        ? isBookmarked(session.user.id, "post", p.id)
        : Promise.resolve(false),
    ]);

  const tags = (p.tags as string[]) ?? [];
  const postUrl =
    typeof window !== "undefined"
      ? window.location.href
      : `${process.env.NEXT_PUBLIC_APP_URL || ""}/communities/${slug}/posts/${postSlug}`;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-1 text-sm text-muted-foreground">
        {ancestors.map((a, i) => (
          <span key={a.id} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5" />}
            <Link
              href={`/communities/${a.slug}`}
              className="hover:text-foreground"
            >
              {a.name}
            </Link>
          </span>
        ))}
        {ancestors.length > 0 && <ChevronRight className="h-3.5 w-3.5" />}
        <Link
          href={`/communities/${slug}`}
          className="hover:text-foreground"
        >
          {c.name}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link
          href={`/communities/${slug}/posts`}
          className="hover:text-foreground"
        >
          Posts
        </Link>
      </nav>

      {/* Draft badge */}
      {p.status === "draft" && (
        <Badge variant="outline" className="mb-3">
          Draft
        </Badge>
      )}

      {/* Title */}
      <h1 className="mb-4 text-2xl font-bold leading-tight">{p.title}</h1>

      {/* Author + date */}
      <div className="mb-4 flex items-center justify-between">
        <PostAuthorCard
          displayName={p.authorDisplayName}
          username={p.authorUsername}
          avatarUrl={p.authorAvatarUrl}
          role={p.authorRole}
        />
        {p.publishedAt && (
          <time
            dateTime={p.publishedAt.toISOString()}
            className="text-xs text-muted-foreground"
          >
            {p.publishedAt.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </time>
        )}
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <Link
              key={tag}
              href={`/communities/${slug}/posts?tag=${encodeURIComponent(tag)}`}
            >
              <Badge variant="secondary">{tag}</Badge>
            </Link>
          ))}
        </div>
      )}

      {/* Content */}
      <article className="mb-8">
        <RichTextRenderer content={p.content as TiptapContent} />
      </article>

      {/* Edit link for author */}
      {session?.user.id === p.authorId && (
        <div className="mb-6">
          <Link
            href={`/posts/edit/${p.id}`}
            className="text-sm text-primary hover:underline"
          >
            Edit this post
          </Link>
        </div>
      )}

      {/* Share URL */}
      <section className="mb-8">
        <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Share
        </h2>
        <ShareUrl url={postUrl} />
      </section>

      {/* Reactions + bookmark */}
      <section className="mb-8 flex items-center justify-between">
        <ReactionBar
          targetType="post"
          targetId={p.id}
          counts={reactionCounts}
          userReactions={userReactions}
        />
        <BookmarkButton
          targetType="post"
          targetId={p.id}
          bookmarked={bookmarkedState}
        />
      </section>

      {/* Comments — 7.4 */}
      <section className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        Comments coming soon
      </section>
    </div>
  );
}
