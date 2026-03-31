import { Sidebar } from "@/components/sidebar";
import { BottomNav } from "@/components/bottom-nav";

interface AppShellProps {
  children: React.ReactNode;
  sidebarNav?: "default" | "platform";
  sidebarHeader?: React.ReactNode;
  sidebarBackHref?: string;
}

export function AppShell({
  children,
  sidebarNav,
  sidebarHeader,
  sidebarBackHref,
}: AppShellProps) {
  return (
    <div className="flex h-screen">
      <Sidebar nav={sidebarNav} header={sidebarHeader} backHref={sidebarBackHref} />
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        <div className="mx-auto max-w-5xl px-4 py-6">{children}</div>
      </main>
      <BottomNav />
    </div>
  );
}
