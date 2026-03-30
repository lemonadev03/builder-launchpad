import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { Briefcase } from "lucide-react";
import { getActiveJobs } from "@/lib/queries/job";
import { JobCard } from "@/components/job-card";
import { JobFilters } from "@/components/job-filters";

export const metadata: Metadata = {
  title: "Jobs | Builder Launchpad",
  description:
    "Browse job listings for builders — search by keyword, filter by type and location.",
};

interface Props {
  searchParams: Promise<{
    page?: string;
    q?: string;
    type?: string;
    location?: string;
    remote?: string;
  }>;
}

export default async function JobsPage({ searchParams }: Props) {
  const {
    page: pageParam,
    q: search,
    type: typeParam,
    location,
    remote: remoteParam,
  } = await searchParams;

  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const limit = 20;
  const offset = (page - 1) * limit;
  const remote = remoteParam === "true" ? true : undefined;

  const { jobs, total } = await getActiveJobs({
    limit,
    offset,
    search: search || undefined,
    employmentType: typeParam || undefined,
    location: location || undefined,
    remote,
  });

  const totalPages = Math.ceil(total / limit);
  const hasFilters = !!(search || typeParam || location || remoteParam);

  function buildPageUrl(p: number) {
    const params = new URLSearchParams();
    if (p > 1) params.set("page", String(p));
    if (search) params.set("q", search);
    if (typeParam) params.set("type", typeParam);
    if (location) params.set("location", location);
    if (remoteParam) params.set("remote", remoteParam);
    const qs = params.toString();
    return `/jobs${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Briefcase className="h-5 w-5" />
          <h1 className="text-lg font-semibold">Jobs</h1>
        </div>
        <span className="text-sm text-muted-foreground">
          {total} listing{total !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <Suspense>
          <JobFilters />
        </Suspense>
      </div>

      {/* Results */}
      {jobs.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          {hasFilters
            ? "No listings match your filters."
            : "No job listings yet."}
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {jobs.map((j) => (
            <JobCard key={j.id} job={j} />
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
