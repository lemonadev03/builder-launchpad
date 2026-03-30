import { Sidebar } from "@/components/sidebar";
import { BottomNav } from "@/components/bottom-nav";
import type { NavItem } from "@/lib/nav";

interface AppShellProps {
  children: React.ReactNode;
  sidebarItems?: NavItem[];
  sidebarHeader?: React.ReactNode;
}

export function AppShell({
  children,
  sidebarItems,
  sidebarHeader,
}: AppShellProps) {
  return (
    <div className="flex h-screen">
      <Sidebar items={sidebarItems} header={sidebarHeader} />
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        <div className="mx-auto max-w-5xl px-4 py-6">{children}</div>
      </main>
      <BottomNav />
    </div>
  );
}
