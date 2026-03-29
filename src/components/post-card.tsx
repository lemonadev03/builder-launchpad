import Link from "next/link";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface PostCardProps {
  title: string;
  slug: string;
  communitySlug: string;
  authorName: string;
  authorUsername: string;
  authorAvatarUrl: string | null;
  publishedAt: Date | null;
  tags: string[];
  excerpt: string | null;
}

export function PostCard({
  title,
  slug,
  communitySlug,
  authorName,
  authorUsername,
  authorAvatarUrl,
  publishedAt,
  tags,
  excerpt,
}: PostCardProps) {
  return (
    <Link
      href={`/communities/${communitySlug}/posts/${slug}`}
      className="block rounded-lg border px-4 py-3.5 transition-colors hover:bg-muted/50"
    >
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
    </Link>
  );
}
