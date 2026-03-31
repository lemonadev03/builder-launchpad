import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { GraduationCap } from "lucide-react";
import { getProfileByUsername } from "@/lib/queries/profile";
import { getUserCommunities } from "@/lib/queries/membership";
import { getSession } from "@/lib/session";
import { ProfileHeader } from "@/components/profile-header";
import { ProfileTags } from "@/components/profile-tags";
import { SocialLinks } from "@/components/social-links";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { SocialLinks as SocialLinksType } from "@/db/schema";

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const p = await getProfileByUsername(username);

  if (!p) {
    return { title: "Profile Not Found | Builder Launchpad" };
  }

  const description =
    p.tagline || p.bio?.slice(0, 160) || `${p.displayName} on Builder Launchpad`;

  return {
    title: `${p.displayName} (@${p.username}) | Builder Launchpad`,
    description,
    openGraph: {
      title: `${p.displayName} (@${p.username})`,
      description,
    },
  };
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;
  const p = await getProfileByUsername(username);

  if (!p) notFound();

  const socialLinks = (p.socialLinks ?? {}) as SocialLinksType;
  const hasEducation = p.educationSchool || p.educationProgram;
  const hasSocialLinks = Object.values(socialLinks).some(
    (v) => v && v.trim() !== "",
  );
  const [communities, session] = await Promise.all([
    getUserCommunities(p.userId),
    getSession(),
  ]);
  const isOwner = session?.user.id === p.userId;

  return (
    <div className="mx-auto max-w-2xl">
      <ProfileHeader
        displayName={p.displayName}
        username={p.username}
        tagline={p.tagline}
        avatarUrl={p.avatarUrl}
        bannerUrl={p.bannerUrl}
        location={p.location}
        isOwner={isOwner}
      />

      <div className="mt-4 space-y-6 px-4 sm:px-6">
        {/* Tags */}
        <ProfileTags tags={p.tags} />

        {/* Bio */}
        {p.bio && (
          <section>
            <h2 className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              About
            </h2>
            <p className="whitespace-pre-line text-sm leading-relaxed">
              {p.bio}
            </p>
          </section>
        )}

        {/* Social Links */}
        {hasSocialLinks && (
          <section>
            <h2 className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Links
            </h2>
            <SocialLinks links={socialLinks} />
          </section>
        )}

        {/* Education */}
        {hasEducation && (
          <section>
            <h2 className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Education
            </h2>
            <div className="flex items-start gap-2 text-sm">
              <GraduationCap className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div>
                {p.educationSchool && (
                  <p className="font-medium">{p.educationSchool}</p>
                )}
                {p.educationProgram && (
                  <p className="text-muted-foreground">
                    {p.educationProgram}
                    {p.educationYear && ` · ${p.educationYear}`}
                  </p>
                )}
                {!p.educationProgram && p.educationYear && (
                  <p className="text-muted-foreground">{p.educationYear}</p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Community memberships */}
        <section>
          <h2 className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Communities
          </h2>
          {communities.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No community memberships yet.
            </p>
          ) : (
            <div className="space-y-2">
              {communities.map((c) => (
                <Link
                  key={c.communityId}
                  href={`/communities/${c.communitySlug}`}
                  className="flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors hover:bg-muted/50"
                >
                  <Avatar className="h-8 w-8">
                    {c.communityLogoUrl ? (
                      <AvatarImage src={c.communityLogoUrl} alt={c.communityName} />
                    ) : null}
                    <AvatarFallback className="text-xs">
                      {c.communityName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="flex-1 truncate text-sm font-medium">
                    {c.communityName}
                  </span>
                  {c.role !== "member" && (
                    <Badge variant="outline" className="text-xs capitalize">
                      {c.role}
                    </Badge>
                  )}
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Blog posts placeholder */}
        <section>
          <h2 className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Posts
          </h2>
          <p className="text-sm text-muted-foreground">No posts yet.</p>
        </section>
      </div>
    </div>
  );
}
