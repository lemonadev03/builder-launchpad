"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

export function CommunityFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [location, setLocation] = useState(
    searchParams.get("location") ?? "",
  );

  const currentSort = searchParams.get("sort") ?? "newest";

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
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

  // Debounced search + location
  useEffect(() => {
    const timer = setTimeout(() => {
      const prevSearch = searchParams.get("q") ?? "";
      const prevLocation = searchParams.get("location") ?? "";
      const searchChanged = search !== prevSearch;
      const locationChanged = location !== prevLocation;

      if (searchChanged || locationChanged) {
        updateParams({
          q: search || null,
          location: location || null,
        });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search, location, searchParams, updateParams]);

  function setSort(value: string) {
    updateParams({ sort: value === "newest" ? null : value });
  }

  const hasFilters = search || location || currentSort !== "newest";

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search communities..."
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
        <select
          value={currentSort}
          onChange={(e) => setSort(e.target.value)}
          className="h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-ring/50"
        >
          <option value="newest">Newest</option>
          <option value="members">Most Members</option>
        </select>
      </div>

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
