import { notFound } from "next/navigation";
import { getCommunityBySlug } from "@/lib/queries/community";
import { getCommunityTree } from "@/lib/queries/community-tree";
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

  // Find the root community to build the full tree
  let rootId = c.id;
  let rootSlug = slug;
  if (c.parentId) {
    // Walk up to root
    let currentId: string | null = c.parentId;
    const { community: commTable } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");
    const { db } = await import("@/db");

    while (currentId) {
      const [parent] = await db
        .select({
          id: commTable.id,
          slug: commTable.slug,
          parentId: commTable.parentId,
        })
        .from(commTable)
        .where(eq(commTable.id, currentId))
        .limit(1);

      if (!parent) break;
      rootId = parent.id;
      rootSlug = parent.slug;
      currentId = parent.parentId;
    }
  }

  const tree = await getCommunityTree(rootId);
  if (!tree) notFound();

  const isAdmin = session
    ? await hasPermission(session.user.id, c.id, "community.edit")
    : false;

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
