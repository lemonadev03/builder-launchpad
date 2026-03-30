import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getProfileByUserId } from "@/lib/queries/profile";

export default async function PlatformGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (session) {
    const profile = await getProfileByUserId(session.user.id);
    if (profile && !profile.onboardingCompletedAt) {
      redirect("/onboarding");
    }
  }

  return <>{children}</>;
}
