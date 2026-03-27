import { redirect } from "next/navigation";
import { requireSession } from "@/lib/session";
import { getProfileByUserId } from "@/lib/queries/profile";
import { OnboardingWizard } from "@/components/onboarding-wizard";

export default async function OnboardingPage() {
  const session = await requireSession();
  const profile = await getProfileByUserId(session.user.id);

  if (!profile) {
    redirect("/feed");
  }

  // Already completed onboarding
  if (profile.onboardingCompletedAt) {
    redirect("/feed");
  }

  return (
    <OnboardingWizard
      profile={{
        displayName: profile.displayName,
        username: profile.username,
        avatarUrl: profile.avatarUrl,
      }}
    />
  );
}
