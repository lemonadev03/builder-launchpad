import Link from "next/link";
import { Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PlatformUserActions } from "@/components/platform-user-actions";
import { PlatformUserStatusBadge } from "@/components/platform-user-status-badge";
import { getPlatformUsers } from "@/lib/queries/platform-user";

interface Props {
  searchParams: Promise<{
    page?: string;
    q?: string;
    status?: string;
  }>;
}

function buildPageUrl(params: { page: number; q?: string; status?: string }) {
  const nextParams = new URLSearchParams();

  if (params.page > 1) nextParams.set("page", String(params.page));
  if (params.q) nextParams.set("q", params.q);
  if (params.status && params.status !== "all") {
    nextParams.set("status", params.status);
  }

  const queryString = nextParams.toString();
  return queryString ? `/platform/users?${queryString}` : "/platform/users";
}

export default async function PlatformUsersPage({ searchParams }: Props) {
  const { page: pageParam, q, status: statusParam } = await searchParams;
  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);
  const limit = 25;
  const offset = (page - 1) * limit;
  const status =
    statusParam === "active" ||
    statusParam === "suspended" ||
    statusParam === "deleted"
      ? statusParam
      : "all";

  const { users, total } = await getPlatformUsers({
    limit,
    offset,
    search: q || undefined,
    status,
  });

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                User management
              </CardTitle>
              <CardDescription>
                Search across the full platform and run suspend, unsuspend, and
                soft-delete actions.
              </CardDescription>
            </div>
            <div className="text-sm text-muted-foreground">
              {total} user{total === 1 ? "" : "s"}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 lg:grid-cols-[1fr_180px_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="q"
                placeholder="Search by name, username, or email"
                defaultValue={q}
                className="pl-9"
              />
            </div>

            <select
              name="status"
              defaultValue={status}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="deleted">Deleted</option>
            </select>

            <div className="flex gap-2">
              <Button type="submit">Apply</Button>
              <Link
                href="/platform/users"
                className={buttonVariants({ variant: "outline" })}
              >
                Reset
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="px-0">
          {users.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              No users match the current filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b text-xs uppercase tracking-[0.12em] text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Username</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Communities</th>
                    <th className="px-4 py-3 font-medium">Joined</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((platformUser) => (
                    <tr
                      key={platformUser.id}
                      className="border-b align-top last:border-b-0"
                    >
                      <td className="px-4 py-4">
                        <div className="min-w-[220px] space-y-1">
                          <Link
                            href={`/platform/users/${platformUser.id}`}
                            className="font-medium hover:text-primary"
                          >
                            {platformUser.displayName}
                          </Link>
                          {platformUser.isPlatformAdmin && (
                            <p className="text-xs text-muted-foreground">
                              Platform admin
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">
                        @{platformUser.username}
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">
                        {platformUser.email}
                      </td>
                      <td className="px-4 py-4">{platformUser.communitiesCount}</td>
                      <td className="px-4 py-4 text-muted-foreground">
                        {platformUser.createdAt.toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-4">
                        <PlatformUserStatusBadge status={platformUser.status} />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end">
                          {platformUser.isPlatformAdmin ? (
                            <span className="text-xs text-muted-foreground">
                              Protected
                            </span>
                          ) : (
                            <PlatformUserActions
                              userId={platformUser.id}
                              userLabel={platformUser.displayName}
                              status={platformUser.status}
                              compact
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={buildPageUrl({
                page: page - 1,
                q: q || undefined,
                status,
              })}
              className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"
            >
              Previous
            </Link>
          )}
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={buildPageUrl({
                page: page + 1,
                q: q || undefined,
                status,
              })}
              className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
