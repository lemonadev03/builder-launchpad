"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface TagFilterProps {
  tags: Array<{ tag: string; count: number }>;
  selected: string | null;
  basePath: string;
}

export function TagFilter({ tags, selected, basePath }: TagFilterProps) {
  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      <Link href={basePath}>
        <Badge variant={selected === null ? "default" : "outline"}>All</Badge>
      </Link>
      {tags.map((t) => (
        <Link
          key={t.tag}
          href={
            selected === t.tag
              ? basePath
              : `${basePath}?tag=${encodeURIComponent(t.tag)}`
          }
        >
          <Badge variant={selected === t.tag ? "default" : "outline"}>
            {t.tag}
            <span className="ml-1 opacity-60">{t.count}</span>
          </Badge>
        </Link>
      ))}
    </div>
  );
}
