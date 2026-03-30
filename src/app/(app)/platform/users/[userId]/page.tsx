import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink, GraduationCap, Layers3, ScrollText, Shield } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlatformUserActions } from "@/components/platform-user-actions";
import { PlatformUserStatusBadge } from "@/components/platform-user-status-badge";
import { ProfileTags } from "@/components/profile-tags";
import { SocialLinks } from "@/components/social-links";
import { getPlatformUserActionLog, getPlatformUserDetail } from "@/lib/queries/platform-user";
import type { SocialLinks as SocialLinksType } from "@/db/schema";

interface Props {
  params: Promise<{ userId: string }>;
}

export default async function PlatformUserDetailPage({ params }: Props) {
  const { userId } = await params;
  const user = await getPlatformUserDetail(userId);

  if (!user) notFound();

  const actionLog = await getPlatformUserActionLog(userId);
  const socialLinks = (user.socialLinks ?? {}) as SocialLinksType;
  const hasEducation = user.educationSchool || user.educationProgram;
  const hasSocialLinks = Object.values(socialLinks).some(
    (value) => value && value.trim() !== "",
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <Link
            href="/platform/users"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to users
          </Link>

          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16 rounded-2xl">
              {user.avatarUrl ? (
                <AvatarImage src={user.avatarUrl} alt={user.displayName} />
              ) : null}
              <AvatarFallback className="rounded-2xl text-lg">
                {user.displayName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-semibold tracking-tight">
                  {user.displayName}
                </h2>
                <PlatformUserStatusBadge status={user.status} />
                {user.isPlatformAdmin && <Badge variant="outline">Platform admin</Badge>}
                {user.isCompanyPoster && <Badge variant="outline">Company poster</Badge>}
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span>@{user.username}</span>
                <span>{user.email}</span>
                <span>
                  Joined{" "}
                  {user.createdAt.toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>

              <p className="max-w-2xl text-sm text-muted-foreground">
                {user.tagline || user.bio || "No profile summary available."}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-start gap-3">
          {user.status !== "deleted" && (
            <Link
              href={`/profile/${user.username}`}
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              Open public profile
            </Link>
          )}

          {!user.isPlatformAdmin && (
            <PlatformUserActions
              userId={user.id}
              userLabel={user.displayName}
              status={user.status}
            />
          )}
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <Card size="sm">
          <CardHeader>
            <CardDescription>Memberships</CardDescription>
            <CardTitle>{user.memberships.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardDescription>Recent posts</CardDescription>
            <CardTitle>{user.posts.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardDescription>Onboarding</CardDescription>
            <CardTitle>{user.onboardingCompletedAt ? "Complete" : "Pending"}</CardTitle>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardDescription>Last updated</CardDescription>
            <CardTitle>
              {user.updatedAt.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </CardTitle>
          </CardHeader>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              Public-facing profile data and linked identity information.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <ProfileTags tags={user.tags} />

            {user.bio && (
              <div>
                <h3 className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  About
                </h3>
                <p className="whitespace-pre-line text-sm leading-relaxed">
                  {user.bio}
                </p>
              </div>
            )}

            {hasSocialLinks && (
              <div>
                <h3 className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Links
                </h3>
                <SocialLinks links={socialLinks} />
              </div>
            )}

            {hasEducation && (
              <div>
                <h3 className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Education
                </h3>
                <div className="flex items-start gap-2 text-sm">
                  <GraduationCap className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    {user.educationSchool && (
                      <p className="font-medium">{user.educationSchool}</p>
                    )}
                    {user.educationProgram && (
                      <p className="text-muted-foreground">
                        {user.educationProgram}
                        {user.educationYear ? ` · ${user.educationYear}` : ""}
                      </p>
                    )}
                    {!user.educationProgram && user.educationYear && (
                      <p className="text-muted-foreground">{user.educationYear}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers3 className="h-4 w-4" />
                Memberships
              </CardTitle>
              <CardDescription>
                Community roles and statuses across the platform.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {user.memberships.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No memberships found.
                </p>
              ) : (
                <div className="space-y-3">
                  {user.memberships.map((membership) => (
                    <Link
                      key={membership.membershipId}
                      href={`/platform/communities/${membership.communityId}`}
                      className="block rounded-lg border px-3 py-3 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {membership.communityName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            /communities/{membership.communitySlug}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize">
                            {membership.role}
                          </Badge>
                          <Badge variant="outline" className="capitalize">
                            {membership.status}
                          </Badge>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ScrollText className="h-4 w-4" />
                Recent content
              </CardTitle>
              <CardDescription>
                Latest authored posts across communities.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {user.posts.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No posts found.
                </p>
              ) : (
                <div className="space-y-3">
                  {user.posts.map((post) => (
                    <Link
                      key={post.id}
                      href={`/communities/${post.communitySlug}/posts/${post.slug}`}
                      className="block rounded-lg border px-3 py-3 transition-colors hover:bg-muted/50"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{post.title}</p>
                          <Badge variant="outline" className="capitalize">
                            {post.status}
                          </Badge>
                          {post.hiddenAt && <Badge variant="outline">Hidden</Badge>}
                          {post.archivedAt && <Badge variant="outline">Archived</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {post.communityName} ·{" "}
                          {post.createdAt.toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Platform action log
              </CardTitle>
              <CardDescription>
                Recent anti-abuse entries for this user.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {actionLog.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No platform actions logged yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {actionLog.map((entry) => (
                    <div key={entry.id} className="rounded-lg border px-3 py-3">
                      <p className="text-sm font-medium">{entry.action}</p>
                      <p className="text-xs text-muted-foreground">
                        {entry.createdAt.toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
