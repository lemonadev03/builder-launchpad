import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { ChevronRight, Users } from "lucide-react";
import { getCommunityBySlug } from "@/lib/queries/community";
import { getAncestorChain, getAllDescendants } from "@/lib/queries/community-tree";
import { getMembership } from "@/lib/queries/membership";
import { getCommunityDirectoryProfiles } from "@/lib/queries/directory";
import { getAllTags } from "@/lib/queries/profile";
import { getSession } from "@/lib/session";
import { ProfileCard } from "@/components/profile-card";
import { DirectoryFilters } from "@/components/directory-filters";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    page?: string;
    q?: string;
    tags?: string;
    location?: string;
  }>;
}

export default async function CommunityMembersPage({
  params,
  searchParams,
}: Props) {
  const { slug } = await params;
  const {
    page: pageParam,
    q: search,
    tags: tagsParam,
    location,
  } = await searchParams;

  const c = await getCommunityBySlug(slug);
  if (!c || c.archivedAt) notFound();

  // Unlisted: require membership
  if (c.visibility === "unlisted") {
    const session = await getSession();
    if (!session) notFound();
    const mem = await getMembership(session.user.id, c.id);
    if (!mem || mem.status !== "active") notFound();
  }

  const page = Math.max(1, parseInt(pageParam ?? "1", 10));
  const limit = 20;
  const offset = (page - 1) * limit;

  const tagSlugs = tagsParam
    ? tagsParam.split(",").filter(Boolean)
    : undefined;

  // Get this community + all descendants for flattened member view
  const descendants = await getAllDescendants(c.id);
  const allCommunityIds = [c.id, ...descendants.map((d) => d.id)];

  const [{ profiles, total }, allTags, ancestors] = await Promise.all([
    getCommunityDirectoryProfiles(allCommunityIds, {
      limit,
      offset,
      search: search || undefined,
      tagSlugs,
      location: location || undefined,
    }),
    getAllTags(),
    c.parentId ? getAncestorChain(c.id) : Promise.resolve([]),
  ]);

  const totalPages = Math.ceil(total / limit);
  const hasFilters = !!(search || tagsParam || location);

  function buildPageUrl(p: number) {
    const params = new URLSearchParams();
    if (p > 1) params.set("page", String(p));
    if (search) params.set("q", search);
    if (tagsParam) params.set("tags", tagsParam);
    if (location) params.set("location", location);
    const qs = params.toString();
    return `/communities/${slug}/members${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-1 text-sm text-muted-foreground">
        {ancestors.map((a, i) => (
          <span key={a.id} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5" />}
            <Link
              href={`/communities/${a.slug}`}
              className="hover:text-foreground"
            >
              {a.name}
            </Link>
          </span>
        ))}
        {ancestors.length > 0 && <ChevronRight className="h-3.5 w-3.5" />}
        <Link
          href={`/communities/${slug}`}
          className="hover:text-foreground"
        >
          {c.name}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span>Members</span>
      </nav>

      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          <h1 className="text-lg font-semibold">Members</h1>
        </div>
        <span className="text-sm text-muted-foreground">
          {total} member{total !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Filters (no community filter for per-community view) */}
      <div className="mb-6">
        <Suspense>
          <DirectoryFilters
            tags={allTags}
            showCommunityFilter={false}
          />
        </Suspense>
      </div>

      {/* Results */}
      {profiles.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          {hasFilters
            ? "No members match your filters."
            : "No members yet."}
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
