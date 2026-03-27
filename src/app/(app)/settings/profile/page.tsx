import { redirect } from "next/navigation";
import { requireSession } from "@/lib/session";
import { getProfileByUserId } from "@/lib/queries/profile";
import { ProfileEditForm } from "@/components/profile-edit-form";
import type { SocialLinks } from "@/db/schema";

export default async function SettingsProfilePage() {
  const session = await requireSession();
  const profile = await getProfileByUserId(session.user.id);

  if (!profile) {
    redirect("/onboarding");
  }

  return (
    <div className="mx-auto max-w-2xl py-6">
      <div className="mb-6">
        <h1 className="text-lg font-semibold">Edit Profile</h1>
        <p className="text-sm text-muted-foreground">
          Update your profile information visible to the community.
        </p>
      </div>

      <ProfileEditForm
        profile={{
          ...profile,
          socialLinks: (profile.socialLinks ?? {}) as SocialLinks,
        }}
      />
    </div>
  );
}
