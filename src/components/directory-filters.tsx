"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Tag {
  slug: string;
  label: string;
  color: string | null;
}

interface Community {
  id: string;
  name: string;
  slug: string;
}

interface DirectoryFiltersProps {
  tags: Tag[];
  communities?: Community[];
  showCommunityFilter?: boolean;
}

export function DirectoryFilters({
  tags,
  communities,
  showCommunityFilter = true,
}: DirectoryFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [location, setLocation] = useState(
    searchParams.get("location") ?? "",
  );

  const selectedTags = searchParams.get("tags")?.split(",").filter(Boolean) ?? [];
  const selectedCommunity = searchParams.get("community") ?? "";
  const includeSisters = searchParams.get("sisters") === "true";

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      // Reset page when filters change
      params.delete("page");

      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }

      const qs = params.toString();
      router.push(`?${qs}`, { scroll: false });
    },
    [router, searchParams],
  );

  // Debounced search + location (single effect to avoid race condition)
  useEffect(() => {
    const timer = setTimeout(() => {
      const currentSearch = searchParams.get("q") ?? "";
      const currentLocation = searchParams.get("location") ?? "";
      const searchChanged = search !== currentSearch;
      const locationChanged = location !== currentLocation;

      if (searchChanged || locationChanged) {
        updateParams({
          q: search || null,
          location: location || null,
        });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search, location, searchParams, updateParams]);

  function toggleTag(slug: string) {
    const next = selectedTags.includes(slug)
      ? selectedTags.filter((t) => t !== slug)
      : [...selectedTags, slug];
    updateParams({ tags: next.length > 0 ? next.join(",") : null });
  }

  function setCommunity(id: string) {
    updateParams({ community: id || null, sisters: null });
  }

  function toggleSisters() {
    updateParams({ sisters: includeSisters ? null : "true" });
  }

  const hasFilters =
    search || location || selectedTags.length > 0 || selectedCommunity;

  return (
    <div className="space-y-4">
      {/* Search + Location */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search builders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-md border bg-transparent pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/50"
          />
        </div>
        <input
          type="text"
          placeholder="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="h-9 w-36 rounded-md border bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/50 sm:w-44"
        />
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t) => {
            const active = selectedTags.includes(t.slug);
            return (
              <button
                key={t.slug}
                onClick={() => toggleTag(t.slug)}
                className="cursor-pointer"
              >
                <Badge
                  variant={active ? "default" : "outline"}
                  className="text-xs transition-colors"
                  style={
                    active && t.color
                      ? {
                          backgroundColor: t.color,
                          color: "#fff",
                          borderColor: t.color,
                        }
                      : !active && t.color
                        ? {
                            color: t.color,
                            borderColor: `${t.color}50`,
                          }
                        : undefined
                  }
                >
                  {t.label}
                </Badge>
              </button>
            );
          })}
        </div>
      )}

      {/* Community filter */}
      {showCommunityFilter && communities && communities.length > 0 && (
        <select
          value={selectedCommunity}
          onChange={(e) => setCommunity(e.target.value)}
          className="h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-ring/50"
        >
          <option value="">All communities</option>
          {communities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      )}

      {/* Sister communities toggle */}
      {showCommunityFilter && selectedCommunity && (
        <button
          onClick={toggleSisters}
          className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs transition-colors ${
            includeSisters
              ? "border-primary bg-primary/10 text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Include sister communities
        </button>
      )}

      {/* Clear filters */}
      {hasFilters && (
        <button
          onClick={() => {
            setSearch("");
            setLocation("");
            router.push("?", { scroll: false });
          }}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <X className="h-3 w-3" />
          Clear filters
        </button>
      )}
    </div>
  );
}
