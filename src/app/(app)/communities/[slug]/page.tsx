import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCommunityBySlug } from "@/lib/queries/community";
import { getMembership } from "@/lib/queries/membership";
import { getSession } from "@/lib/session";
import { CommunityHeader } from "@/components/community-header";
import { JoinButton } from "@/components/join-button";

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

  // Check if current user is a member
  let isMember = false;
  if (session) {
    const mem = await getMembership(session.user.id, c.id);
    isMember = mem?.status === "active";
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
        {/* Join CTA */}
        <div className="flex items-center justify-between">
          <JoinButton
            joinPolicy={c.joinPolicy as "invite_only" | "request_to_join" | "open"}
            isMember={isMember}
          />
          {isMember && (
            <a
              href={`/communities/${slug}/manage`}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Manage &rarr;
            </a>
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
