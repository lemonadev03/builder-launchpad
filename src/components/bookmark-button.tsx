"use client";

import { useOptimistic, useTransition } from "react";
import { Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";

interface BookmarkButtonProps {
  targetType: "post" | "listing";
  targetId: string;
  bookmarked: boolean;
}

export function BookmarkButton({
  targetType,
  targetId,
  bookmarked: initialBookmarked,
}: BookmarkButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [optimisticBookmarked, setOptimistic] = useOptimistic(initialBookmarked);

  function toggle() {
    startTransition(async () => {
      setOptimistic(!optimisticBookmarked);
      await fetch("/api/bookmarks", {
        method: optimisticBookmarked ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetId }),
      });
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors",
        optimisticBookmarked
          ? "text-primary"
          : "text-muted-foreground hover:text-foreground",
      )}
      title={optimisticBookmarked ? "Remove bookmark" : "Bookmark"}
    >
      <Bookmark
        className={cn("h-4 w-4", optimisticBookmarked && "fill-current")}
      />
      <span>{optimisticBookmarked ? "Saved" : "Save"}</span>
    </button>
  );
}
