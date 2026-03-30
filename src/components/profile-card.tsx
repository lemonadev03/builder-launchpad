import Link from "next/link";
import { MapPin } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { DirectoryProfile } from "@/lib/queries/directory";

interface ProfileCardProps {
  profile: DirectoryProfile;
}

export function ProfileCard({ profile: p }: ProfileCardProps) {
  return (
    <Link
      href={`/profile/${p.username}`}
      className="block rounded-lg border p-4 transition-colors hover:bg-muted/50"
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-12 w-12 shrink-0">
          {p.avatarUrl ? (
            <AvatarImage src={p.avatarUrl} alt={p.displayName} />
          ) : null}
          <AvatarFallback>
            {p.displayName.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{p.displayName}</p>
          <p className="text-xs text-muted-foreground">@{p.username}</p>

          {p.tagline && (
            <p className="mt-1 line-clamp-2 text-xs text-foreground/70">
              {p.tagline}
            </p>
          )}
        </div>
      </div>

      {/* Tags */}
      {p.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {p.tags.map((t) => (
            <Badge
              key={t.slug}
              variant="secondary"
              className="text-[10px]"
              style={
                t.color
                  ? {
                      backgroundColor: `${t.color}15`,
                      color: t.color,
                      borderColor: `${t.color}30`,
                    }
                  : undefined
              }
            >
              {t.label}
            </Badge>
          ))}
        </div>
      )}

      {/* Location + Communities */}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
        {p.location && (
          <span className="flex items-center gap-0.5">
            <MapPin className="h-3 w-3" />
            {p.location}
          </span>
        )}
        {p.communities.slice(0, 2).map((c) => (
          <Badge key={c.communityId} variant="outline" className="text-[10px]">
            {c.communityName}
            {c.role !== "member" && ` · ${c.role}`}
          </Badge>
        ))}
        {p.communities.length > 2 && (
          <span className="text-[10px]">
            +{p.communities.length - 2} more
          </span>
        )}
      </div>
    </Link>
  );
}

export function ProfileCardSkeleton() {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 shrink-0 animate-pulse rounded-full bg-muted" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          <div className="h-3 w-20 animate-pulse rounded bg-muted" />
          <div className="h-3 w-48 animate-pulse rounded bg-muted" />
        </div>
      </div>
      <div className="mt-3 flex gap-1">
        <div className="h-5 w-14 animate-pulse rounded-full bg-muted" />
        <div className="h-5 w-12 animate-pulse rounded-full bg-muted" />
      </div>
    </div>
  );
}
