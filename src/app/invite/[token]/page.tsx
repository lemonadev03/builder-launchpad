import { redirect } from "next/navigation";
import Link from "next/link";
import { Users } from "lucide-react";
import { getSession } from "@/lib/session";
import { getInviteByToken, redeemInvite } from "@/lib/queries/invite";
import { getProfileByUserId } from "@/lib/queries/profile";
import { buttonVariants } from "@/components/ui/button-variants";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { community } from "@/db/schema";
import { cn } from "@/lib/utils";

interface Props {
  params: Promise<{ token: string }>;
}

function ErrorCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Link
            href="/"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Go Home
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

export default async function InvitePage({ params }: Props) {
  const { token } = await params;

  // Validate the invite token
  const inv = await getInviteByToken(token);

  if (!inv || inv.revokedAt) {
    return (
      <ErrorCard
        title="Invalid Invite"
        description="This invite link is invalid or has been revoked."
      />
    );
  }

  // Fetch community info
  const [comm] = await db
    .select({
      id: community.id,
      name: community.name,
      slug: community.slug,
      tagline: community.tagline,
      logoUrl: community.logoUrl,
      archivedAt: community.archivedAt,
    })
    .from(community)
    .where(eq(community.id, inv.communityId))
    .limit(1);

  if (!comm || comm.archivedAt) {
    return (
      <ErrorCard
        title="Community Not Found"
        description="The community for this invite no longer exists."
      />
    );
  }

  // Check if user is authenticated
  const session = await getSession();

  if (session) {
    // Auto-redeem the invite
    const result = await redeemInvite(token, session.user.id);

    if (result.error === "invalid") {
      return (
        <ErrorCard
          title="Invalid Invite"
          description="This invite link is invalid or has been revoked."
        />
      );
    }

    // Check if onboarding is needed
    const profile = await getProfileByUserId(session.user.id);
    if (!profile || !profile.onboardingCompletedAt) {
      redirect(`/onboarding?community=${comm.slug}`);
    }

    // Redirect to the community
    redirect(`/communities/${comm.slug}`);
  }

  // Unauthenticated — show invite landing
  const initials = comm.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Avatar className="h-16 w-16">
              {comm.logoUrl ? (
                <AvatarImage src={comm.logoUrl} alt={comm.name} />
              ) : null}
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
          </div>
          <CardTitle className="text-xl">
            You&apos;ve been invited to join
          </CardTitle>
          <CardDescription className="text-base font-medium text-foreground">
            {comm.name}
          </CardDescription>
          {comm.tagline && (
            <p className="mt-1 text-sm text-muted-foreground">
              {comm.tagline}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          <Link
            href={`/signup?invite=${token}`}
            className={cn(buttonVariants(), "w-full")}
          >
            Sign up to join
          </Link>
          <Link
            href={`/login?invite=${token}`}
            className={cn(buttonVariants({ variant: "outline" }), "w-full")}
          >
            Log in to join
          </Link>
        </CardContent>
        <CardFooter className="justify-center">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            <span>Builder Launchpad</span>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
