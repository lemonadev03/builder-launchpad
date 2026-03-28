import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireSession } from "@/lib/session";
import { getCommunityBySlug } from "@/lib/queries/community";
import { hasPermission } from "@/lib/permissions";

interface Props {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

const NAV_ITEMS = [
  { label: "Dashboard", href: "" },
  { label: "Settings", href: "/settings" },
  { label: "Members", href: "/members" },
  { label: "Invites", href: "/invites" },
];

export default async function CommunityManageLayout({
  children,
  params,
}: Props) {
  const { slug } = await params;
  const session = await requireSession();

  const community = await getCommunityBySlug(slug);
  if (!community || community.archivedAt) notFound();

  const canManage = await hasPermission(
    session.user.id,
    community.id,
    "community.manage_settings",
  );
  if (!canManage) redirect(`/communities/${slug}`);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-lg font-semibold">{community.name}</h1>
        <p className="text-sm text-muted-foreground">Community Management</p>
      </div>

      <nav className="mb-6 flex gap-1 border-b">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={`/communities/${slug}/manage${item.href}`}
            className="border-b-2 border-transparent px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {children}
    </div>
  );
}
