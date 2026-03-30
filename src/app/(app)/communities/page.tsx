import { getDirectoryCommunities } from "@/lib/queries/community";
import { CommunityCard } from "@/components/community-card";

export default async function CommunitiesPage() {
  const { communities } = await getDirectoryCommunities({
    limit: 20,
    offset: 0,
  });

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-lg font-semibold">Communities</h1>
        <p className="text-sm text-muted-foreground">
          Discover builder communities on the platform.
        </p>
      </div>

      {communities.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {communities.map((c) => (
            <CommunityCard key={c.id} community={c} />
          ))}
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No communities yet. Be the first to create one.
        </p>
      )}
    </div>
  );
}
