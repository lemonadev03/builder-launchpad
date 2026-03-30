import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { Users } from "lucide-react";
import { getDirectoryProfiles } from "@/lib/queries/directory";
import { getAllTags } from "@/lib/queries/profile";
import { getListedCommunities } from "@/lib/queries/community";
import { getAllSisterLinks } from "@/lib/queries/sister";
import { ProfileCard, ProfileCardSkeleton } from "@/components/profile-card";
import { DirectoryFilters } from "@/components/directory-filters";

export const metadata: Metadata = {
  title: "People Directory | Builder Launchpad",
  description:
    "Discover builders across communities — search by skills, location, and community.",
};

interface Props {
  searchParams: Promise<{
    page?: string;
    q?: string;
    tags?: string;
    location?: string;
    community?: string;
    sisters?: string;
  }>;
}

export default async function DirectoryPage({ searchParams }: Props) {
  const {
    page: pageParam,
    q: search,
    tags: tagsParam,
    location,
    community,
    sisters: sistersParam,
  } = await searchParams;

  const page = Math.max(1, parseInt(pageParam ?? "1", 10));
  const limit = 20;
  const offset = (page - 1) * limit;
  const includeSisters = sistersParam === "true" && !!community;

  const tagSlugs = tagsParam
    ? tagsParam.split(",").filter(Boolean)
    : undefined;

  // Resolve sister community IDs when toggle is active
  let communityIds: string[] | undefined;
  if (community && includeSisters) {
    const sisters = await getAllSisterLinks(community);
    const sisterIds = sisters
      .filter((s) => s.status === "active")
      .map((s) => s.communityId);
    communityIds = [community, ...sisterIds];
  }

  const [{ profiles, total }, allTags, allCommunities] = await Promise.all([
    getDirectoryProfiles({
      limit,
      offset,
      search: search || undefined,
      tagSlugs,
      location: location || undefined,
      communityId: includeSisters ? undefined : (community || undefined),
      communityIds: includeSisters ? communityIds : undefined,
    }),
    getAllTags(),
    getListedCommunities(),
  ]);

  const totalPages = Math.ceil(total / limit);
  const hasFilters = !!(search || tagsParam || location || community);

  function buildPageUrl(p: number) {
    const params = new URLSearchParams();
    if (p > 1) params.set("page", String(p));
    if (search) params.set("q", search);
    if (tagsParam) params.set("tags", tagsParam);
    if (location) params.set("location", location);
    if (community) params.set("community", community);
    if (sistersParam) params.set("sisters", sistersParam);
    const qs = params.toString();
    return `/directory${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          <h1 className="text-lg font-semibold">People Directory</h1>
        </div>
        <span className="text-sm text-muted-foreground">
          {total} builder{total !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <Suspense>
          <DirectoryFilters
            tags={allTags}
            communities={allCommunities.map((c) => ({
              id: c.id,
              name: c.name,
              slug: c.slug,
            }))}
          />
        </Suspense>
      </div>

      {/* Results */}
      {profiles.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          {hasFilters
            ? "No builders match your filters."
            : "No builders on the platform yet."}
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {profiles.map((p) => (
            <ProfileCard key={p.userId} profile={p} />
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
