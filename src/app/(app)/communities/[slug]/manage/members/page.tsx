import { notFound, redirect } from "next/navigation";
import { requireSession } from "@/lib/session";
import { getCommunityBySlug } from "@/lib/queries/community";
import { getMembersByCommunity } from "@/lib/queries/membership";
import { hasPermission } from "@/lib/permissions";
import { MembersTable } from "@/components/members-table";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ManageMembersPage({ params }: Props) {
  const { slug } = await params;
  const session = await requireSession();

  const community = await getCommunityBySlug(slug);
  if (!community || community.archivedAt) notFound();

  const canManage = await hasPermission(
    session.user.id,
    community.id,
    "community.manage_members",
  );
  if (!canManage) redirect(`/communities/${slug}`);

  const members = await getMembersByCommunity(community.id);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold">Members</h2>
        <p className="text-sm text-muted-foreground">
          {members.length} active member{members.length !== 1 ? "s" : ""}
        </p>
      </div>

      <MembersTable
        members={members}
        communitySlug={slug}
        currentUserId={session.user.id}
      />
    </div>
  );
}
