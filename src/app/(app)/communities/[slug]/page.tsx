import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCommunityBySlug } from "@/lib/queries/community";
import { getMembership } from "@/lib/queries/membership";
import { getUserJoinRequestStatus } from "@/lib/queries/join-request";
import { getSession } from "@/lib/session";
import { CommunityHeader } from "@/components/community-header";
import { JoinButton } from "@/components/join-button";
import { LeaveButton } from "@/components/leave-button";

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
  if (session) {
    const mem = await getMembership(session.user.id, c.id);
    isMember = mem?.status === "active";
    isSuspended = mem?.status === "suspended";
    if (!isMember && !isSuspended) {
      requestStatus = await getUserJoinRequestStatus(session.user.id, c.id);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
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

        {/* Sub-communities placeholder */}
        <section>
          <h2 className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Sub-communities
          </h2>
          <p className="text-sm text-muted-foreground">
            No sub-communities yet.
          </p>
        </section>
      </div>
    </div>
  );
}
