import { notFound, redirect } from "next/navigation";
import { requireSession } from "@/lib/session";
import { getCommunityBySlug } from "@/lib/queries/community";
import { hasPermission } from "@/lib/permissions";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function AdminPostsPage({ params }: Props) {
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
        <h2 className="text-lg font-semibold">Posts</h2>
        <p className="text-sm text-muted-foreground">
          Manage community posts.
        </p>
      </div>
      <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        Post management coming soon.
      </p>
    </div>
  );
}
