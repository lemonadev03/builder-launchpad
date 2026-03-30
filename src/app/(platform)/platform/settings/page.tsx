import { Settings2, Users, Building2, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlatformTagManager } from "@/components/platform-tag-manager";
import { getPlatformStats } from "@/lib/platform-admin";
import { listPlatformTags } from "@/lib/queries/platform-tag";

export default async function PlatformSettingsPage() {
  const [stats, tags] = await Promise.all([
    getPlatformStats(),
    listPlatformTags(),
  ]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            Platform settings
          </CardTitle>
          <CardDescription>
            Configure shared platform metadata and monitor the high-level footprint of Builder Launchpad.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border px-4 py-3">
            <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted">
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-semibold">{stats.totalUsers}</p>
            <p className="text-sm text-muted-foreground">Total users</p>
          </div>
          <div className="rounded-lg border px-4 py-3">
            <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted">
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-semibold">{stats.totalCommunities}</p>
            <p className="text-sm text-muted-foreground">Total communities</p>
          </div>
          <div className="rounded-lg border px-4 py-3">
            <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted">
              <FileText className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-semibold">{stats.totalPosts}</p>
            <p className="text-sm text-muted-foreground">Total posts</p>
          </div>
        </CardContent>
      </Card>

      <PlatformTagManager initialTags={tags} />
    </div>
  );
}
