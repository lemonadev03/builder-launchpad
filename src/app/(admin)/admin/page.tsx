import Link from "next/link";
import { requireSession } from "@/lib/session";
import { getAdminCommunities } from "@/lib/queries/membership";
import { getMemberCount } from "@/lib/queries/membership";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default async function AdminPage() {
  const session = await requireSession();
  const communities = await getAdminCommunities(session.user.id);

  const communityStats = await Promise.all(
    communities.map(async (c) => ({
      ...c,
      memberCount: await getMemberCount(c.communityId),
    })),
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-lg font-semibold">Your Communities</h1>
        <p className="text-sm text-muted-foreground">
          Manage the communities you administer or moderate.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {communityStats.map((c) => (
          <Link
            key={c.communityId}
            href={`/admin/${c.communitySlug}`}
            className="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50"
          >
            <Avatar className="h-10 w-10">
              {c.communityLogoUrl ? (
                <AvatarImage src={c.communityLogoUrl} alt={c.communityName} />
              ) : null}
              <AvatarFallback className="text-xs">
                {c.communityName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{c.communityName}</p>
              <p className="text-xs text-muted-foreground">
                {c.memberCount} member{c.memberCount !== 1 ? "s" : ""}
              </p>
            </div>
            <Badge variant="outline" className="text-xs capitalize">
              {c.role}
            </Badge>
          </Link>
        ))}
      </div>
    </div>
  );
}
