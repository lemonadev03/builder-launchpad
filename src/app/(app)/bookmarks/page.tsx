import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Bookmark } from "lucide-react";
import { getSession } from "@/lib/session";
import {
  getUserPostBookmarks,
  getUserListingBookmarks,
} from "@/lib/queries/bookmark";
import { PostCard } from "@/components/post-card";
import { JobCard } from "@/components/job-card";
import type { JobListingWithCompany } from "@/lib/queries/job";

export const metadata: Metadata = {
  title: "Bookmarks | Builder Launchpad",
};

interface Props {
  searchParams: Promise<{ tab?: string }>;
}

export default async function BookmarksPage({ searchParams }: Props) {
  const session = await getSession();
  if (!session) redirect("/login");

  const sp = await searchParams;
  const tab = sp.tab === "jobs" ? "jobs" : "posts";

  const [postResult, listingResult] = await Promise.all([
    getUserPostBookmarks(session.user.id, { limit: 50, offset: 0 }),
    getUserListingBookmarks(session.user.id, { limit: 50, offset: 0 }),
  ]);

  const totalCount = postResult.total + listingResult.total;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center gap-2">
        <Bookmark className="h-5 w-5" />
        <h1 className="text-lg font-semibold">Bookmarks</h1>
        <span className="text-sm text-muted-foreground">({totalCount})</span>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 border-b">
        <a
          href="/bookmarks"
          className={`px-3 py-2 text-sm transition-colors ${
            tab === "posts"
              ? "border-b-2 border-foreground font-medium"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Posts ({postResult.total})
        </a>
        <a
          href="/bookmarks?tab=jobs"
          className={`px-3 py-2 text-sm transition-colors ${
            tab === "jobs"
              ? "border-b-2 border-foreground font-medium"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Jobs ({listingResult.total})
        </a>
      </div>

      {/* Post bookmarks */}
      {tab === "posts" && (
        <>
          {postResult.bookmarks.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              No saved posts yet.
            </div>
          ) : (
            <div className="space-y-2">
              {postResult.bookmarks.map((b) => (
                <PostCard
                  key={b.bookmarkId}
                  title={b.postTitle}
                  slug={b.postSlug}
                  communitySlug={b.communitySlug}
                  authorName={b.authorDisplayName}
                  authorAvatarUrl={b.authorAvatarUrl}
                  publishedAt={b.postPublishedAt}
                  tags={(b.postTags as string[]) ?? []}
                  excerpt={b.postExcerpt}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Listing bookmarks */}
      {tab === "jobs" && (
        <>
          {listingResult.bookmarks.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              No saved job listings yet.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {listingResult.bookmarks.map((b) => (
                <JobCard
                  key={b.bookmarkId}
                  job={
                    {
                      id: b.jobId,
                      title: b.jobTitle,
                      description: b.jobDescription,
                      requirements: null,
                      location: b.jobLocation,
                      remote: b.jobRemote,
                      employmentType: b.jobEmploymentType,
                      salaryRange: b.jobSalaryRange,
                      applicationUrl: b.jobApplicationUrl,
                      postedBy: "",
                      createdAt: b.jobCreatedAt,
                      updatedAt: b.jobCreatedAt,
                      companyId: "",
                      companyName: b.companyName,
                      companyLogoUrl: b.companyLogoUrl,
                      companyWebsite: null,
                      companyDescription: null,
                    } satisfies JobListingWithCompany
                  }
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
