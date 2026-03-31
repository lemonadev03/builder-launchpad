import { Sidebar } from "@/components/sidebar";
import { BottomNav } from "@/components/bottom-nav";

interface AppShellProps {
  children: React.ReactNode;
  sidebarNav?: "default" | "platform";
  sidebarHeader?: React.ReactNode;
  sidebarBackHref?: string;
  sidebarSlot?: React.ReactNode;
  showAdminLink?: boolean;
}

export function AppShell({
  children,
  sidebarNav,
  sidebarHeader,
  sidebarBackHref,
  sidebarSlot,
  showAdminLink,
}: AppShellProps) {
  return (
    <div className="flex h-screen">
      {sidebarSlot ?? (
        <Sidebar
          nav={sidebarNav}
          header={sidebarHeader}
          backHref={sidebarBackHref}
          showAdminLink={showAdminLink}
        />
      )}
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        <div className="mx-auto max-w-5xl px-4 py-6">{children}</div>
      </main>
      <BottomNav showAdminLink={showAdminLink} />
    </div>
  );
}
