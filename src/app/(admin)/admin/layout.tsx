import { redirect } from "next/navigation";
import { requireSession } from "@/lib/session";
import { getAdminCommunities } from "@/lib/queries/membership";
import { AppShell } from "@/components/app-shell";
import { AdminSidebar } from "@/components/admin-sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  const communities = await getAdminCommunities(session.user.id);

  if (communities.length === 0) redirect("/communities");

  return (
    <AppShell
      sidebarSlot={
        <AdminSidebar
          communities={communities.map((c) => ({
            communitySlug: c.communitySlug,
            communityName: c.communityName,
            communityLogoUrl: c.communityLogoUrl,
            role: c.role as "admin" | "moderator",
          }))}
        />
      }
    >
      {children}
    </AppShell>
  );
}
