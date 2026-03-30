import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { requirePlatformAdminSession } from "@/lib/platform-admin";

function PlatformSidebarHeader() {
  return (
    <div className="space-y-2">
      <Link
        href="/feed"
        className="flex items-center gap-2 px-3 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" />
        Back to app
      </Link>
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
          <Shield className="h-3.5 w-3.5 text-primary-foreground" />
        </div>
        <span className="text-sm font-semibold">Platform Admin</span>
      </div>
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
    >
      {children}
    </AppShell>
  );
}
