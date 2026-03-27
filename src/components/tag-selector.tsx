"use client";

import { useEffect, useState } from "react";
import { X, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Tag {
  id: string;
  slug: string;
  label: string;
  color?: string | null;
}

interface TagSelectorProps {
  selectedSlugs: string[];
  onChange: (slugs: string[]) => void;
  max?: number;
}

export function TagSelector({
  selectedSlugs,
  onChange,
  max = 3,
}: TagSelectorProps) {
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/tags")
      .then((r) => r.json())
      .then((data) => setAllTags(data.tags ?? []))
      .catch(() => {});
  }, []);

  const selected = allTags.filter((t) => selectedSlugs.includes(t.slug));
  const available = allTags.filter((t) => !selectedSlugs.includes(t.slug));
  const atMax = selectedSlugs.length >= max;

  function addTag(slug: string) {
    if (!atMax) {
      onChange([...selectedSlugs, slug]);
    }
  }

  function removeTag(slug: string) {
    onChange(selectedSlugs.filter((s) => s !== slug));
  }

  return (
    <div className="space-y-2">
      {/* Selected tags */}
      <div className="flex flex-wrap gap-1.5">
        {selected.map((tag) => (
          <Badge
            key={tag.slug}
            variant="secondary"
            className="gap-1 pr-1 text-xs"
            style={
              tag.color
                ? {
                    backgroundColor: `${tag.color}15`,
                    color: tag.color,
                    borderColor: `${tag.color}30`,
                  }
                : undefined
            }
          >
            {tag.label}
            <button
              type="button"
              onClick={() => removeTag(tag.slug)}
              className="ml-0.5 rounded-full p-0.5 hover:bg-foreground/10"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}

        {!atMax && (
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={() => setOpen(!open)}
            className="gap-1 text-xs"
          >
            <Plus className="h-3 w-3" />
            Add tag
          </Button>
        )}
      </div>

      {/* Tag count indicator */}
      <p className="text-xs text-muted-foreground">
        {selectedSlugs.length}/{max} tags selected
      </p>

      {/* Dropdown */}
      {open && available.length > 0 && (
        <div className="rounded-md border border-border bg-background p-2">
          <div className="flex flex-wrap gap-1.5">
            {available.map((tag) => (
              <button
                key={tag.slug}
                type="button"
                onClick={() => {
                  addTag(tag.slug);
                  if (selectedSlugs.length + 1 >= max) setOpen(false);
                }}
                className="inline-flex items-center rounded-md border border-border/50 bg-muted/30 px-2 py-1 text-xs transition-colors hover:bg-muted"
                style={
                  tag.color
                    ? { color: tag.color, borderColor: `${tag.color}30` }
                    : undefined
                }
              >
                {tag.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
