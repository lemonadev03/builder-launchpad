"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

export function PlatformCommunityFilters() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const rootOnly = searchParams.get("root") === "1";
  const status = searchParams.get("status") ?? "active";
  const depth = searchParams.get("depth") ?? "all";

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
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      const previous = searchParams.get("q") ?? "";
      if (search !== previous) {
        updateParams({ q: search || null });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search, searchParams, updateParams]);

  const hasFilters =
    search.trim().length > 0 ||
    rootOnly ||
    status !== "active" ||
    depth !== "all";

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 lg:flex-row">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by community name"
            className="h-9 w-full rounded-md border bg-transparent pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/50"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <label className="inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm">
            <input
              type="checkbox"
              checked={rootOnly}
              onChange={(event) =>
                updateParams({ root: event.target.checked ? "1" : null })
              }
              className="h-4 w-4 rounded border"
            />
            Root only
          </label>

          <select
            value={status}
            onChange={(event) =>
              updateParams({
                status: event.target.value === "active" ? null : event.target.value,
              })
            }
            className="h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-ring/50"
          >
            <option value="active">Active only</option>
            <option value="all">Active + archived</option>
            <option value="archived">Archived only</option>
          </select>

          <select
            value={depth}
            onChange={(event) =>
              updateParams({
                depth: event.target.value === "all" ? null : event.target.value,
              })
            }
            className="h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-ring/50"
          >
            <option value="all">All depths</option>
            <option value="0">Depth 0</option>
            <option value="1">Depth 1</option>
            <option value="2">Depth 2</option>
            <option value="3">Depth 3</option>
          </select>
        </div>
      </div>

      {hasFilters && (
        <button
          type="button"
          onClick={() => {
            setSearch("");
            router.push(pathname, { scroll: false });
          }}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <X className="h-3 w-3" />
          Clear filters
        </button>
      )}
    </div>
  );
}

