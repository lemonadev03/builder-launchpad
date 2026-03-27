import { notFound } from "next/navigation";
import Link from "next/link";
import { Users, Settings, Layers, Shield } from "lucide-react";
import { requireSession } from "@/lib/session";
import { getCommunityBySlug } from "@/lib/queries/community";
import { getMemberCount, getPendingRequestCount } from "@/lib/queries/membership";
import { hasPermission } from "@/lib/permissions";
import { Badge } from "@/components/ui/badge";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function CommunityDashboardPage({ params }: Props) {
  const { slug } = await params;
  const session = await requireSession();

  const community = await getCommunityBySlug(slug);
  if (!community || community.archivedAt) notFound();

  const canManage = await hasPermission(
    session.user.id,
    community.id,
    "community.manage_settings",
  );
  if (!canManage) notFound();

  const [memberCount, pendingCount] = await Promise.all([
    getMemberCount(community.id),
    getPendingRequestCount(community.id),
  ]);

  const links = [
    {
      href: `/communities/${slug}/manage/settings`,
      icon: Settings,
      label: "Settings",
      description: "Community details, visibility, join policy",
      enabled: true,
    },
    {
      href: `/communities/${slug}/manage/members`,
      icon: Users,
      label: "Members",
      description: "Manage roles and membership",
      enabled: true,
    },
    {
      href: "#",
      icon: Layers,
      label: "Chapters",
      description: "Sub-community management",
      enabled: false,
    },
    {
      href: "#",
      icon: Shield,
      label: "Moderation",
      description: "Content flags and member actions",
      enabled: false,
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold">Dashboard</h2>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-4">
        <div className="rounded-lg border p-4">
          <p className="text-2xl font-bold">{memberCount}</p>
          <p className="text-sm text-muted-foreground">
            Active member{memberCount !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-2xl font-bold">{pendingCount}</p>
          <p className="text-sm text-muted-foreground">
            Pending request{pendingCount !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Quick Links */}
      <div className="space-y-2">
        {links.map((link) => {
          const Icon = link.icon;

          if (!link.enabled) {
            return (
              <div
                key={link.label}
                className="flex items-center gap-3 rounded-lg border p-4 opacity-50"
              >
                <Icon className="h-5 w-5 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{link.label}</p>
                    <Badge variant="outline" className="text-xs">
                      Coming soon
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {link.description}
                  </p>
                </div>
              </div>
            );
          }

          return (
            <Link
              key={link.label}
              href={link.href}
              className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50"
            >
              <Icon className="h-5 w-5 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{link.label}</p>
                <p className="text-xs text-muted-foreground">
                  {link.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
