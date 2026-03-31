import { notFound, redirect } from "next/navigation";
import { requireSession } from "@/lib/session";
import { getCommunityBySlug } from "@/lib/queries/community";
import { hasPermission } from "@/lib/permissions";

interface Props {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function CommunityAdminLayout({
  children,
  params,
}: Props) {
  const { slug } = await params;
  const session = await requireSession();

  const community = await getCommunityBySlug(slug);
  if (!community || community.archivedAt) notFound();

  const [canManage, canModerate] = await Promise.all([
    hasPermission(session.user.id, community.id, "community.manage_settings"),
    hasPermission(session.user.id, community.id, "content.moderate"),
  ]);
  if (!canManage && !canModerate) redirect("/admin");

  return <>{children}</>;
}
