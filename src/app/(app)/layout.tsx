import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getSession } from "@/lib/session";
import { getProfileByUserId } from "@/lib/queries/profile";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  // Redirect authenticated users who haven't completed onboarding
  if (session) {
    const profile = await getProfileByUserId(session.user.id);
    if (profile && !profile.onboardingCompletedAt) {
      redirect("/onboarding");
    }
  }

  return <AppShell>{children}</AppShell>;
}
