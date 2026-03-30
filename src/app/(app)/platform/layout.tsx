import { Shield } from "lucide-react";
import { PlatformNav } from "@/components/platform-nav";
import { requirePlatformAdminSession } from "@/lib/platform-admin";

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePlatformAdminSession();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            <Shield className="h-3.5 w-3.5" />
            Platform Admin
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Platform control center
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Manage Builder Launchpad at the platform layer across communities,
            users, moderation, and tags.
          </p>
        </div>
      </div>

      <PlatformNav />
      {children}
    </div>
  );
}
