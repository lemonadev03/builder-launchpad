import { getListedCommunities } from "@/lib/queries/community";
import { CommunityCard } from "@/components/community-card";

export default async function CommunitiesPage() {
  const communities = await getListedCommunities();

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-lg font-semibold">Communities</h1>
        <p className="text-sm text-muted-foreground">
          Discover builder communities on the platform.
        </p>
      </div>

      {communities.length > 0 ? (
        <div className="space-y-2">
          {communities.map((c) => (
            <CommunityCard
              key={c.id}
              name={c.name}
              slug={c.slug}
              tagline={c.tagline}
              logoUrl={c.logoUrl}
              location={c.location}
              primaryColor={c.primaryColor}
            />
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
