import Link from "next/link";
import { MapPin, Users, GitBranch } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { DirectoryCommunity } from "@/lib/queries/community";

const policyLabel = {
  open: "Open",
  request_to_join: "Request to Join",
  invite_only: "Invite Only",
} as const;

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

interface CommunityCardProps {
  community: DirectoryCommunity;
}

export function CommunityCard({ community: c }: CommunityCardProps) {
  return (
    <Link
      href={`/communities/${c.slug}`}
      className="block rounded-lg border p-4 transition-colors hover:bg-muted/50"
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg"
          style={{ backgroundColor: c.primaryColor || undefined }}
        >
          {c.logoUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={c.logoUrl}
              alt={c.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-sm font-bold text-white">
              {getInitials(c.name)}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{c.name}</p>
          {c.tagline && (
            <p className="mt-0.5 line-clamp-2 text-xs text-foreground/70">
              {c.tagline}
            </p>
          )}
        </div>
      </div>

      {/* Counts + Location + Policy */}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-0.5">
          <Users className="h-3 w-3" />
          {c.memberCount} member{c.memberCount !== 1 ? "s" : ""}
        </span>
        {c.chapterCount > 0 && (
          <span className="flex items-center gap-0.5">
            <GitBranch className="h-3 w-3" />
            {c.chapterCount} chapter{c.chapterCount !== 1 ? "s" : ""}
          </span>
        )}
        {c.location && (
          <span className="flex items-center gap-0.5">
            <MapPin className="h-3 w-3" />
            {c.location}
          </span>
        )}
        <Badge variant="outline" className="ml-auto text-[10px]">
          {policyLabel[c.joinPolicy]}
        </Badge>
      </div>
    </Link>
  );
}

export function CommunityCardSkeleton() {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 shrink-0 animate-pulse rounded-lg bg-muted" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          <div className="h-3 w-48 animate-pulse rounded bg-muted" />
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <div className="h-4 w-20 animate-pulse rounded bg-muted" />
        <div className="h-4 w-16 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
