import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { community } from "@/db/schema";
import { getCommunityBySlug } from "@/lib/queries/community";
import { getCommunityTree } from "@/lib/queries/community-tree";
import { getMembership } from "@/lib/queries/membership";
import { getSession } from "@/lib/session";
import { hasPermission } from "@/lib/permissions";
import { OrgChart } from "@/components/org-chart";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function OrgChartPage({ params }: Props) {
  const { slug } = await params;
  const session = await getSession();
  const c = await getCommunityBySlug(slug);

  if (!c || c.archivedAt) notFound();

  // Require membership to view org chart
  if (!session) notFound();
  const mem = await getMembership(session.user.id, c.id);
  if (!mem || mem.status !== "active") notFound();

  // Walk up to root community
  let rootId = c.id;
  if (c.parentId) {
    let currentId: string | null = c.parentId;
    let iterations = 0;

    while (currentId && iterations < 5) {
      const [parent] = await db
        .select({
          id: community.id,
          parentId: community.parentId,
        })
        .from(community)
        .where(eq(community.id, currentId))
        .limit(1);

      if (!parent) break;
      rootId = parent.id;
      currentId = parent.parentId;
      iterations++;
    }
  }

  const tree = await getCommunityTree(rootId);
  if (!tree) notFound();

  const isAdmin = await hasPermission(session.user.id, c.id, "community.edit");

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 px-4 sm:px-6">
        <h1 className="text-lg font-semibold">Organization Chart</h1>
        <p className="text-sm text-muted-foreground">
          Hierarchy of {tree.name} and all sub-communities.
        </p>
      </div>

      <OrgChart tree={tree} currentSlug={slug} isAdmin={isAdmin} />
    </div>
  );
}
