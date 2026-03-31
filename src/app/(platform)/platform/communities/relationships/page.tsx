import { getPlatformCommunities } from "@/lib/queries/community";
import { getCommunityTree, type TreeNode } from "@/lib/queries/community-tree";
import { getAllPlatformSisterLinks } from "@/lib/queries/sister";
import { RelationshipBuilder } from "@/components/relationship-builder";

export default async function RelationshipsPage() {
  const { communities: roots } = await getPlatformCommunities({
    limit: 200,
    offset: 0,
    rootOnly: true,
    status: "all",
  });

  const trees: TreeNode[] = [];
  for (const root of roots) {
    const tree = await getCommunityTree(root.id, { includeArchived: true });
    if (tree) trees.push(tree);
  }

  const sisterLinks = await getAllPlatformSisterLinks();

  return <RelationshipBuilder trees={trees} sisterLinks={sisterLinks} />;
}
