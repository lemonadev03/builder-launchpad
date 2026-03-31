import { notFound } from "next/navigation";
import Link from "next/link";
import { Users, Settings, Shield, LinkIcon, Layers } from "lucide-react";
import { requireSession } from "@/lib/session";
import { getCommunityBySlug } from "@/lib/queries/community";
import { getMemberCount } from "@/lib/queries/membership";
import { getPendingJoinRequestCount } from "@/lib/queries/join-request";
import { getOpenFlagCount } from "@/lib/queries/flag";
import { getAllDescendants } from "@/lib/queries/community-tree";
import { hasPermission } from "@/lib/permissions";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function AdminDashboardPage({ params }: Props) {
  const { slug } = await params;
  const session = await requireSession();

  const community = await getCommunityBySlug(slug);
  if (!community || community.archivedAt) notFound();

  const canManage = await hasPermission(
    session.user.id,
    community.id,
    "community.manage_settings",
  );

  const descendants = await getAllDescendants(community.id);
  const allCommunityIds = [community.id, ...descendants.map((d) => d.id)];

  const [memberCount, pendingCount, openFlagCount] = await Promise.all([
    getMemberCount(community.id),
    getPendingJoinRequestCount(community.id),
    getOpenFlagCount(allCommunityIds),
  ]);

  const links = [
    {
      href: `/admin/${slug}/settings`,
      icon: Settings,
      label: "Settings",
      description: "Community details, visibility, join policy",
      visible: canManage,
    },
    {
      href: `/admin/${slug}/members`,
      icon: Users,
      label: "Members",
      description: "Manage roles and membership",
      visible: canManage,
    },
    {
      href: `/admin/${slug}/invites`,
      icon: LinkIcon,
      label: "Invites",
      description: "Generate and manage invite links",
      visible: canManage,
    },
    {
      href: `/communities/${slug}`,
      icon: Layers,
      label: community.subTierLabel || "Sub-communities",
      description: "View and create sub-communities",
      visible: canManage,
    },
    {
      href: `/admin/${slug}/moderation`,
      icon: Shield,
      label: "Moderation",
      description: "Content flags and member actions",
      visible: true,
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold">Dashboard</h2>
      </div>

      <div className="mb-8 grid grid-cols-3 gap-4">
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
        <div className="rounded-lg border p-4">
          <p className="text-2xl font-bold">{openFlagCount}</p>
          <p className="text-sm text-muted-foreground">
            Open flag{openFlagCount !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {links
          .filter((l) => l.visible)
          .map((link) => {
            const Icon = link.icon;
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
