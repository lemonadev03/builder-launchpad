import Link from "next/link";
import { Building2, GitBranch } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlatformCommunityActions } from "@/components/platform-community-actions";
import { PlatformCommunityFilters } from "@/components/platform-community-filters";
import { PlatformCreateCommunity } from "@/components/platform-create-community";
import { getPlatformCommunities } from "@/lib/queries/community";

interface Props {
  searchParams: Promise<{
    page?: string;
    q?: string;
    root?: string;
    status?: string;
    depth?: string;
  }>;
}

function buildPageUrl(params: {
  page: number;
  q?: string;
  root?: string;
  status?: string;
  depth?: string;
}) {
  const nextParams = new URLSearchParams();

  if (params.page > 1) nextParams.set("page", String(params.page));
  if (params.q) nextParams.set("q", params.q);
  if (params.root === "1") nextParams.set("root", "1");
  if (params.status && params.status !== "active") {
    nextParams.set("status", params.status);
  }
  if (params.depth && params.depth !== "all") {
    nextParams.set("depth", params.depth);
  }

  const queryString = nextParams.toString();
  return queryString ? `/platform/communities?${queryString}` : "/platform/communities";
}

export default async function PlatformCommunitiesPage({ searchParams }: Props) {
  const {
    page: pageParam,
    q,
    root,
    status: statusParam,
    depth: depthParam,
  } = await searchParams;

  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);
  const limit = 25;
  const offset = (page - 1) * limit;
  const status =
    statusParam === "all" || statusParam === "archived"
      ? statusParam
      : "active";
  const depth =
    depthParam && /^[0-3]$/.test(depthParam)
      ? Number.parseInt(depthParam, 10)
      : undefined;

  const { communities, total } = await getPlatformCommunities({
    limit,
    offset,
    search: q || undefined,
    rootOnly: root === "1",
    status,
    depth,
  });

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Community management
              </CardTitle>
              <CardDescription>
                Review every community on the platform, inspect hierarchy, and
                run archive or feature actions.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/platform/communities/relationships">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <GitBranch className="h-3.5 w-3.5" />
                  Relationships
                </Button>
              </Link>
              <PlatformCreateCommunity />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <PlatformCommunityFilters />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="px-0">
          {communities.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              No communities match the current filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b text-xs uppercase tracking-[0.12em] text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Root / Child</th>
                    <th className="px-4 py-3 font-medium">Members</th>
                    <th className="px-4 py-3 font-medium">Created</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {communities.map((community) => (
                    <tr
                      key={community.id}
                      className="border-b align-top last:border-b-0"
                    >
                      <td className="px-4 py-4">
                        <div className="min-w-[240px] space-y-1">
                          <Link
                            href={`/platform/communities/${community.id}`}
                            className="font-medium hover:text-primary"
                          >
                            {community.name}
                          </Link>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              /communities/{community.slug}
                            </span>
                            {community.isFeatured && (
                              <Badge variant="outline">Featured</Badge>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">
                        {community.parentId ? (
                          <div>
                            <div>Child</div>
                            <div className="text-xs">
                              depth {community.depth}
                              {community.parentName
                                ? ` · parent ${community.parentName}`
                                : ""}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div>Root</div>
                            <div className="text-xs">depth 0</div>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4">{community.memberCount}</td>
                      <td className="px-4 py-4 text-muted-foreground">
                        {community.createdAt.toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-4">
                        {community.archivedAt ? (
                          <Badge
                            variant="outline"
                            className="border-amber-200 text-amber-700"
                          >
                            Archived
                          </Badge>
                        ) : (
                          <Badge variant="outline">Active</Badge>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end">
                          <PlatformCommunityActions
                            communityId={community.id}
                            communityName={community.name}
                            isArchived={community.archivedAt !== null}
                            isFeatured={community.isFeatured}
                            compact
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={buildPageUrl({
                page: page - 1,
                q: q || undefined,
                root,
                status,
                depth: depthParam,
              })}
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
              href={buildPageUrl({
                page: page + 1,
                q: q || undefined,
                root,
                status,
                depth: depthParam,
              })}
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

