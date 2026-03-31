import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PlatformAdminInviteForm } from "@/components/platform-admin-invite-form";
import {
  getPlatformStats,
  listPendingPlatformAdminInvites,
  listPlatformAdmins,
} from "@/lib/platform-admin";

export default async function PlatformDashboardPage() {
  const [stats, admins, pendingInvites] = await Promise.all([
    getPlatformStats(),
    listPlatformAdmins(),
    listPendingPlatformAdminInvites(),
  ]);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <Card size="sm">
          <CardHeader>
            <CardDescription>Total communities</CardDescription>
            <CardTitle>{stats.totalCommunities}</CardTitle>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardDescription>Total users</CardDescription>
            <CardTitle>{stats.totalUsers}</CardTitle>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardDescription>Published posts</CardDescription>
            <CardTitle>{stats.totalPosts}</CardTitle>
          </CardHeader>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Platform admins</CardTitle>
            <CardDescription>
              Access is invite-only and can only be managed from this area.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <PlatformAdminInviteForm />
            <div className="space-y-2">
              {admins.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No platform admins found.
                </p>
              ) : (
                admins.map((admin) => (
                  <div
                    key={admin.id}
                    className="flex items-center justify-between rounded-lg border px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {admin.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {admin.email}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      since{" "}
                      {admin.createdAt.toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending invites</CardTitle>
            <CardDescription>
              Emails queued for automatic platform access on signup.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingInvites.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No pending invites.
              </p>
            ) : (
              pendingInvites.map((invite) => (
                <div
                  key={invite.id}
                  className="rounded-lg border px-4 py-3 text-sm"
                >
                  <p className="font-medium">{invite.email}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    invited{" "}
                    {invite.createdAt.toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>

    </div>
  );
}
