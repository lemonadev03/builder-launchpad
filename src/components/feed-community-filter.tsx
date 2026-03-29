"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface Community {
  communityId: string;
  communityName: string;
}

interface FeedCommunityFilterProps {
  communities: Community[];
  selected: string | null;
}

export function FeedCommunityFilter({
  communities,
  selected,
}: FeedCommunityFilterProps) {
  if (communities.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      <Link href="/feed">
        <Badge variant={selected === null ? "default" : "outline"}>All</Badge>
      </Link>
      {communities.map((c) => (
        <Link
          key={c.communityId}
          href={
            selected === c.communityId
              ? "/feed"
              : `/feed?community=${encodeURIComponent(c.communityId)}`
          }
        >
          <Badge
            variant={selected === c.communityId ? "default" : "outline"}
          >
            {c.communityName}
          </Badge>
        </Link>
      ))}
    </div>
  );
}
