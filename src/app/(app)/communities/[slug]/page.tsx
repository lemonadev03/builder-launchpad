import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";
import { getCommunityBySlug } from "@/lib/queries/community";
import { getMembership } from "@/lib/queries/membership";
import { getUserJoinRequestStatus } from "@/lib/queries/join-request";
import { getAncestorChain, getChildCommunities } from "@/lib/queries/community-tree";
import { getAllSisterLinks } from "@/lib/queries/sister";
import { getRecentPostsByCommunity } from "@/lib/queries/post";
import { getReactionCountsBatch } from "@/lib/queries/reaction";
import { getCommentCountsBatch } from "@/lib/queries/comment";
import { hasPermission } from "@/lib/permissions";
import { getSession } from "@/lib/session";
import { CommunityHeader } from "@/components/community-header";
import { JoinButton } from "@/components/join-button";
import { LeaveButton } from "@/components/leave-button";
import { CreateSubCommunity } from "@/components/create-sub-community";
import { PostCard } from "@/components/post-card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = await getCommunityBySlug(slug);

  if (!c) {
    return { title: "Community Not Found | Builder Launchpad" };
  }

  const description =
    c.tagline || c.description?.slice(0, 160) || `${c.name} on Builder Launchpad`;

  return {
    title: `${c.name} | Builder Launchpad`,
    description,
    openGraph: {
      title: c.name,
      description,
      ...(c.logoUrl && { images: [{ url: c.logoUrl }] }),
    },
  };
}

export default async function CommunityPage({ params }: Props) {
  const { slug } = await params;
  const session = await getSession();
  const c = await getCommunityBySlug(slug);

  if (!c || c.archivedAt) notFound();

  // Unlisted: hide from non-members
  if (c.visibility === "unlisted") {
    if (!session) notFound();
    const mem = await getMembership(session.user.id, c.id);
    if (!mem || mem.status !== "active") notFound();
  }

  // Check if current user is a member + join request status
  let isMember = false;
  let isSuspended = false;
  let requestStatus: string | null = null;
  let canCreateSub = false;
  if (session) {
    const mem = await getMembership(session.user.id, c.id);
    isMember = mem?.status === "active";
    isSuspended = mem?.status === "suspended";
    if (!isMember && !isSuspended) {
      requestStatus = await getUserJoinRequestStatus(session.user.id, c.id);
    }
    if (isMember) {
      canCreateSub = await hasPermission(session.user.id, c.id, "community.edit");
    }
  }

  // Fetch hierarchy data + recent posts
  const [ancestors, children, recentPosts, allSisters] = await Promise.all([
    c.parentId ? getAncestorChain(c.id) : [],
    getChildCommunities(c.id),
    getRecentPostsByCommunity(c.id, 3),
    getAllSisterLinks(c.id),
  ]);

  const activeSisters = allSisters.filter((s) => s.status === "active");

  // Engagement counts for recent posts
  const recentPostIds = recentPosts.map((p) => p.id);
  const [recentReactionMap, recentCommentMap] = await Promise.all([
    getReactionCountsBatch("post", recentPostIds),
    getCommentCountsBatch(recentPostIds),
  ]);

  const tierLabel = c.subTierLabel || "Sub-communities";
  const maxDepthReached = c.depth >= 3;

  return (
    <div className="mx-auto max-w-2xl">
      {/* Breadcrumb */}
      {ancestors.length > 0 && (
        <nav className="mb-3 flex items-center gap-1 px-4 text-sm text-muted-foreground sm:px-6">
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
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground">{c.name}</span>
        </nav>
      )}

      <CommunityHeader
        name={c.name}
        tagline={c.tagline}
        logoUrl={c.logoUrl}
        bannerUrl={c.bannerUrl}
        primaryColor={c.primaryColor}
        memberCount={c.memberCount}
        location={c.location}
      />

      <div className="mt-4 space-y-6 px-4 sm:px-6">
        {/* Suspended notice */}
        {isSuspended && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            Your membership in this community has been suspended.
          </div>
        )}

        {/* Join CTA */}
        <div className="flex items-center justify-between">
          <JoinButton
            joinPolicy={c.joinPolicy as "invite_only" | "request_to_join" | "open"}
            isMember={isMember}
            communitySlug={slug}
            requestStatus={requestStatus}
            isAuthenticated={!!session}
          />
          {isMember && session && (
            <div className="flex items-center gap-2">
              <LeaveButton communitySlug={slug} userId={session.user.id} />
              <a
                href={`/communities/${slug}/manage`}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Manage &rarr;
              </a>
            </div>
          )}
        </div>

        {/* Description */}
        {c.description && (
          <section>
            <h2 className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              About
            </h2>
            <p className="whitespace-pre-line text-sm leading-relaxed">
              {c.description}
            </p>
          </section>
        )}

        {/* Members directory link */}
        <div>
          <Link
            href={`/communities/${slug}/members`}
            className="text-sm text-primary hover:underline"
          >
            View all members &rarr;
          </Link>
        </div>

        {/* Sub-communities */}
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {tierLabel}
              {children.length > 0 && (
                <span className="ml-1">({children.length})</span>
              )}
            </h2>
            {canCreateSub && !maxDepthReached && (
              <CreateSubCommunity
                parentId={c.id}
                tierLabel={tierLabel.replace(/s$/, "")}
              />
            )}
          </div>

          {children.length > 0 && (
            <Link
              href={`/communities/${slug}/org-chart`}
              className="text-xs text-primary hover:underline"
            >
              View org chart
            </Link>
          )}

          {children.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No {tierLabel.toLowerCase()} yet.
            </p>
          ) : (
            <div className="space-y-2">
              {children.map((child) => (
                <Link
                  key={child.id}
                  href={`/communities/${child.slug}`}
                  className="flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors hover:bg-muted/50"
                >
                  <Avatar className="h-8 w-8">
                    {child.logoUrl ? (
                      <AvatarImage src={child.logoUrl} alt={child.name} />
                    ) : null}
                    <AvatarFallback className="text-xs">
                      {child.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{child.name}</p>
                    {child.tagline && (
                      <p className="truncate text-xs text-muted-foreground">
                        {child.tagline}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Sister Communities */}
        {activeSisters.length > 0 && (
          <section>
            <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Sister Communities ({activeSisters.length})
            </h2>
            <div className="space-y-2">
              {activeSisters.map((s) => (
                <Link
                  key={s.linkId}
                  href={`/communities/${s.communitySlug}`}
                  className="flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors hover:bg-muted/50"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary">
                    {s.communityLogoUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={s.communityLogoUrl}
                        alt={s.communityName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-[10px] font-bold text-white">
                        {s.communityName.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {s.communityName}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="shrink-0 text-[10px]"
                  >
                    {s.inherited
                      ? `Via ${s.inheritedFromName}`
                      : "Direct"}
                  </Badge>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Recent Posts */}
        {recentPosts.length > 0 && (
          <section>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Recent Posts
              </h2>
              <Link
                href={`/communities/${slug}/posts`}
                className="text-xs text-primary hover:underline"
              >
                View all
              </Link>
            </div>
            <div className="space-y-2">
              {recentPosts.map((p) => (
                <PostCard
                  key={p.id}
                  title={p.title}
                  slug={p.slug}
                  communitySlug={slug}
                  authorName={p.authorDisplayName}
                  authorAvatarUrl={p.authorAvatarUrl}
                  publishedAt={p.publishedAt}
                  tags={(p.tags as string[]) ?? []}
                  excerpt={p.excerpt}
                  reactionCounts={recentReactionMap.get(p.id)}
                  commentCount={recentCommentMap.get(p.id)}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
