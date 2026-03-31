import { Shield } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { requirePlatformAdminSession } from "@/lib/platform-admin";

function PlatformSidebarHeader() {
  return (
    <div className="flex items-center gap-2 px-3 py-2">
      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
        <Shield className="h-3.5 w-3.5 text-primary-foreground" />
      </div>
      <span className="text-sm font-semibold">Platform Admin</span>
    </div>
  );
}

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePlatformAdminSession();

  return (
    <AppShell
      sidebarNav="platform"
      sidebarHeader={<PlatformSidebarHeader />}
      sidebarBackHref="/feed"
    >
      {children}
    </AppShell>
  );
}
