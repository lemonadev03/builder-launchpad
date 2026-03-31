import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ReactionCountsDisplay } from "@/components/reaction-bar";

interface PostCardProps {
  title: string;
  slug: string;
  communitySlug: string;
  communityName?: string;
  authorName: string;
  authorAvatarUrl: string | null;
  publishedAt: Date | null;
  tags: string[];
  excerpt: string | null;
  reactionCounts?: Record<string, number>;
  commentCount?: number;
}

export function PostCard({
  title,
  slug,
  communitySlug,
  communityName,
  authorName,
  authorAvatarUrl,
  publishedAt,
  tags,
  excerpt,
  reactionCounts,
  commentCount,
}: PostCardProps) {
  return (
    <Link
      href={`/communities/${communitySlug}/posts/${slug}`}
      className="block rounded-lg border px-4 py-3.5 transition-colors hover:bg-muted/50"
    >
      {communityName && (
        <p className="mb-1 text-[11px] font-medium text-muted-foreground">
          {communityName}
        </p>
      )}

      <h3 className="line-clamp-2 text-sm font-medium">{title}</h3>

      <div className="mt-1.5 flex items-center gap-2">
        <Avatar className="h-5 w-5">
          {authorAvatarUrl ? (
            <AvatarImage src={authorAvatarUrl} alt={authorName} />
          ) : null}
          <AvatarFallback className="text-[10px]">
            {authorName.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="text-xs text-muted-foreground">{authorName}</span>
        {publishedAt && (
          <>
            <span className="text-xs text-muted-foreground">&middot;</span>
            <time
              dateTime={publishedAt.toISOString()}
              className="text-xs text-muted-foreground"
            >
              {publishedAt.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </time>
          </>
        )}
      </div>

      {tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-[10px]">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {excerpt && (
        <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">
          {excerpt}
        </p>
      )}

      {(reactionCounts || typeof commentCount === "number") && (
        <div className="mt-2 flex items-center gap-3">
          {reactionCounts && <ReactionCountsDisplay counts={reactionCounts} />}
          {typeof commentCount === "number" && commentCount > 0 && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MessageCircle className="h-3.5 w-3.5" />
              {commentCount}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}
