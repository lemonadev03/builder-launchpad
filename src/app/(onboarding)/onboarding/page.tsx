import { redirect } from "next/navigation";
import { requireSession } from "@/lib/session";
import { getProfileByUserId } from "@/lib/queries/profile";
import { OnboardingWizard } from "@/components/onboarding-wizard";

interface Props {
  searchParams: Promise<{ community?: string }>;
}

export default async function OnboardingPage({ searchParams }: Props) {
  const session = await requireSession();
  const { community: communitySlug } = await searchParams;
  const profile = await getProfileByUserId(session.user.id);

  if (!profile) {
    redirect("/feed");
  }

  // Already completed onboarding
  if (profile.onboardingCompletedAt) {
    redirect(communitySlug ? `/communities/${communitySlug}` : "/feed");
  }

  return (
    <OnboardingWizard
      profile={{
        displayName: profile.displayName,
        username: profile.username,
        avatarUrl: profile.avatarUrl,
      }}
      redirectTo={communitySlug ? `/communities/${communitySlug}` : "/feed"}
    />
  );
}
