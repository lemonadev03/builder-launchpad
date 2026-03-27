import { notFound } from "next/navigation";
import { requireSession } from "@/lib/session";
import { getCommunityBySlug } from "@/lib/queries/community";
import { CommunitySettingsForm } from "@/components/community-settings-form";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ManageSettingsPage({ params }: Props) {
  const { slug } = await params;
  await requireSession();

  const community = await getCommunityBySlug(slug);
  if (!community || community.archivedAt) notFound();

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
        }}
      />
    </div>
  );
}
