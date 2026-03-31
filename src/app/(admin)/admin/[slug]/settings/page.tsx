import { notFound, redirect } from "next/navigation";
import { requireSession } from "@/lib/session";
import { getCommunityBySlug } from "@/lib/queries/community";
import { hasPermission } from "@/lib/permissions";
import { CommunitySettingsForm } from "@/components/community-settings-form";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function AdminSettingsPage({ params }: Props) {
  const { slug } = await params;
  const session = await requireSession();

  const community = await getCommunityBySlug(slug);
  if (!community || community.archivedAt) notFound();

  const canManage = await hasPermission(
    session.user.id,
    community.id,
    "community.manage_settings",
  );
  if (!canManage) redirect(`/admin/${slug}`);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold">Settings</h2>
        <p className="text-sm text-muted-foreground">
          Configure your community&apos;s details and policies.
        </p>
      </div>

      <CommunitySettingsForm
        community={{
          name: community.name,
          slug: community.slug,
          description: community.description,
          tagline: community.tagline,
          location: community.location,
          visibility: community.visibility as "listed" | "unlisted",
          joinPolicy: community.joinPolicy as
            | "invite_only"
            | "request_to_join"
            | "open",
          logoUrl: community.logoUrl,
          bannerUrl: community.bannerUrl,
          primaryColor: community.primaryColor,
          subTierLabel: community.subTierLabel,
        }}
        basePath={`/admin/${slug}`}
      />
    </div>
  );
}
