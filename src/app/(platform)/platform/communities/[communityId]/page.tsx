import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  FileText,
  GitBranch,
  Users,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlatformCommunityActions } from "@/components/platform-community-actions";
import {
  getPlatformChildCommunities,
  getPlatformCommunityDetail,
  getPlatformCommunityPosts,
} from "@/lib/queries/community";
import { getMembersByCommunity } from "@/lib/queries/membership";
import { getCommunityTree, getRootCommunityId } from "@/lib/queries/community-tree";
import { OrgChart } from "@/components/org-chart";

interface Props {
  params: Promise<{ communityId: string }>;
}

export default async function PlatformCommunityDetailPage({ params }: Props) {
  const { communityId } = await params;
  const community = await getPlatformCommunityDetail(communityId);

  if (!community) notFound();

  const [members, children, posts, rootId] = await Promise.all([
    getMembersByCommunity(community.id),
    getPlatformChildCommunities(community.id),
    getPlatformCommunityPosts(community.id),
    getRootCommunityId(community.id, { includeArchived: true }),
  ]);

  const tree = await getCommunityTree(rootId, { includeArchived: true });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <Link
            href="/platform/communities"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to communities
          </Link>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-semibold tracking-tight">
                {community.name}
              </h2>
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
              {community.isFeatured && (
                <Badge variant="outline">Featured</Badge>
              )}
              {community.parentId ? (
                <Badge variant="outline">Child</Badge>
              ) : (
                <Badge variant="outline">Root</Badge>
              )}
            </div>

            <p className="text-sm text-muted-foreground">
              {community.tagline || community.description || "No description yet."}
            </p>

            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span>/communities/{community.slug}</span>
              <span>Depth {community.depth}</span>
              {community.parentName && <span>Parent {community.parentName}</span>}
              <span>
                Created{" "}
                {community.createdAt.toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-start gap-3">
          {!community.archivedAt && (
            <Link
              href={`/communities/${community.slug}`}
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              Open public page
            </Link>
          )}
          <PlatformCommunityActions
            communityId={community.id}
            communityName={community.name}
            isArchived={community.archivedAt !== null}
            isFeatured={community.isFeatured}
          />
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <Card size="sm">
          <CardHeader>
            <CardDescription>Active members</CardDescription>
            <CardTitle>{community.memberCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardDescription>Sub-communities</CardDescription>
            <CardTitle>{community.childCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardDescription>Posts</CardDescription>
            <CardTitle>{community.contentCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardDescription>Visibility</CardDescription>
            <CardTitle className="capitalize">{community.visibility}</CardTitle>
          </CardHeader>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Members
            </CardTitle>
            <CardDescription>
              Roles and statuses for this exact community level.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {members.length === 0 ? (
              <p className="text-sm text-muted-foreground">No members found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b text-xs uppercase tracking-[0.12em] text-muted-foreground">
                    <tr>
                      <th className="py-2 pr-4 font-medium">Member</th>
                      <th className="py-2 pr-4 font-medium">Role</th>
                      <th className="py-2 pr-4 font-medium">Status</th>
                      <th className="py-2 font-medium">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member) => (
                      <tr key={member.id} className="border-b last:border-b-0">
                        <td className="py-3 pr-4">
                          <div className="space-y-1">
                            <Link
                              href={`/profile/${member.username}`}
                              className="font-medium hover:text-primary"
                            >
                              {member.displayName}
                            </Link>
                            <div className="text-xs text-muted-foreground">
                              @{member.username}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 pr-4 capitalize">{member.role}</td>
                        <td className="py-3 pr-4">
                          <Badge variant="outline" className="capitalize">
                            {member.status}
                          </Badge>
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {member.joinedAt.toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-4 w-4" />
              Sub-communities
            </CardTitle>
            <CardDescription>
              Direct children under this community.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {children.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No sub-communities under this node.
              </p>
            ) : (
              children.map((child) => (
                <Link
                  key={child.id}
                  href={`/platform/communities/${child.id}`}
                  className="block rounded-lg border px-3 py-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{child.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Depth {child.depth} · {child.memberCount} members
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {child.isFeatured && (
                        <Badge variant="outline">Featured</Badge>
                      )}
                      {child.archivedAt && (
                        <Badge
                          variant="outline"
                          className="border-amber-200 text-amber-700"
                        >
                          Archived
                        </Badge>
                      )}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            Community tree
          </CardTitle>
          <CardDescription>
            Reused org chart for the full root tree, including archived nodes.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          {tree ? (
            <OrgChart
              tree={tree}
              currentSlug={community.slug}
              isAdmin={false}
              viewHref={(node) => `/platform/communities/${node.id}`}
            />
          ) : (
            <div className="px-4 text-sm text-muted-foreground">
              Tree unavailable.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Content
          </CardTitle>
          <CardDescription>
            Latest posts authored in this community context.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {posts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No content has been created in this community yet.
            </p>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="rounded-lg border px-3 py-3"
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-1">
                      <p className="font-medium">{post.title}</p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>by {post.authorDisplayName}</span>
                        <span>@{post.authorUsername}</span>
                        <span>
                          created{" "}
                          {post.createdAt.toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                        {post.publishedAt && (
                          <span>
                            published{" "}
                            {post.publishedAt.toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="capitalize">
                        {post.status}
                      </Badge>
                      {post.hiddenAt && (
                        <Badge variant="outline">Hidden</Badge>
                      )}
                      {post.archivedAt && (
                        <Badge
                          variant="outline"
                          className="border-amber-200 text-amber-700"
                        >
                          Archived
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

