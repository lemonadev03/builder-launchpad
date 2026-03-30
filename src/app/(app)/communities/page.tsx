import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { Building2 } from "lucide-react";
import { getDirectoryCommunities } from "@/lib/queries/community";
import { CommunityCard } from "@/components/community-card";
import { CommunityFilters } from "@/components/community-filters";

export const metadata: Metadata = {
  title: "Communities | Builder Launchpad",
  description:
    "Discover builder communities — browse, search, and join tech communities on the platform.",
};

interface Props {
  searchParams: Promise<{
    page?: string;
    q?: string;
    location?: string;
    sort?: string;
  }>;
}

export default async function CommunitiesPage({ searchParams }: Props) {
  const {
    page: pageParam,
    q: search,
    location,
    sort: sortParam,
  } = await searchParams;

  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const limit = 20;
  const offset = (page - 1) * limit;
  const sort = sortParam === "members" ? "members" : "newest";

  const { communities, total } = await getDirectoryCommunities({
    limit,
    offset,
    search: search || undefined,
    location: location || undefined,
    sort,
  });

  const totalPages = Math.ceil(total / limit);

  function buildPageUrl(p: number) {
    const params = new URLSearchParams();
    if (p > 1) params.set("page", String(p));
    if (search) params.set("q", search);
    if (location) params.set("location", location);
    if (sortParam) params.set("sort", sortParam);
    const qs = params.toString();
    return `/communities${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          <h1 className="text-lg font-semibold">Communities</h1>
        </div>
        <span className="text-sm text-muted-foreground">
          {total} communit{total !== 1 ? "ies" : "y"}
        </span>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <Suspense>
          <CommunityFilters />
        </Suspense>
      </div>

      {/* Results */}
      {communities.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          {search || location
            ? "No communities match your filters."
            : "No communities on the platform yet."}
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {communities.map((c) => (
            <CommunityCard key={c.id} community={c} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={buildPageUrl(page - 1)}
              className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"
            >
              Previous
            </Link>
          )}
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={buildPageUrl(page + 1)}
              className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
