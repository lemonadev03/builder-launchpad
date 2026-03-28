import { notFound } from "next/navigation";
import { requireSession } from "@/lib/session";
import { getCommunityBySlug } from "@/lib/queries/community";
import { getPendingJoinRequests } from "@/lib/queries/join-request";
import { hasPermission } from "@/lib/permissions";
import { PendingRequests } from "@/components/pending-requests";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function RequestsPage({ params }: Props) {
  const { slug } = await params;
  const session = await requireSession();

  const community = await getCommunityBySlug(slug);
  if (!community || community.archivedAt) notFound();

  const canManage = await hasPermission(
    session.user.id,
    community.id,
    "community.manage_members",
  );
  if (!canManage) notFound();

  const requests = await getPendingJoinRequests(community.id);

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Join Requests</h2>
        <p className="text-sm text-muted-foreground">
          Review and manage pending join requests.
        </p>
      </div>
      <PendingRequests requests={requests} communitySlug={slug} />
    </div>
  );
}
