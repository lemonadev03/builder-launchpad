import { notFound, redirect } from "next/navigation";
import { requireSession } from "@/lib/session";
import { getCommunityBySlug } from "@/lib/queries/community";
import { getInvitesByCommunity } from "@/lib/queries/invite";
import { hasPermission } from "@/lib/permissions";
import { InviteManager } from "@/components/invite-manager";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function AdminInvitesPage({ params }: Props) {
  const { slug } = await params;
  const session = await requireSession();

  const community = await getCommunityBySlug(slug);
  if (!community || community.archivedAt) notFound();

  const canManage = await hasPermission(
    session.user.id,
    community.id,
    "member.invite",
  );
  if (!canManage) redirect(`/admin/${slug}`);

  const invites = await getInvitesByCommunity(community.id);

  return <InviteManager initialInvites={invites} communitySlug={slug} />;
}
