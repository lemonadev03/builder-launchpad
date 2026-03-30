import { Sidebar } from "@/components/sidebar";
import { BottomNav } from "@/components/bottom-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        <div className="mx-auto max-w-5xl px-4 py-6">{children}</div>
      </main>
      <BottomNav />
    </div>
  );
}
