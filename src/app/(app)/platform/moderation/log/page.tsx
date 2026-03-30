import Link from "next/link";
import { ArrowLeft, ScrollText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  getPlatformModerationCommunities,
  getPlatformModerationLog,
  getPlatformModerators,
  PLATFORM_MODERATION_ACTIONS,
} from "@/lib/queries/moderation";

interface Props {
  searchParams: Promise<{
    action?: string;
    moderator?: string;
    community?: string;
    from?: string;
    to?: string;
    page?: string;
  }>;
}

const ACTION_LABELS: Record<string, string> = {
  hide_post: "Hid post",
  unhide_post: "Unhid post",
  delete_post: "Deleted post",
  hide_comment: "Hid comment",
  unhide_comment: "Unhid comment",
  delete_comment: "Deleted comment",
  dismiss_flags: "Dismissed flags",
  warn_member: "Warned member",
  suspend_member: "Suspended member",
  unsuspend_member: "Unsuspended member",
  remove_member: "Removed member",
  warn_user_platform: "Warned user",
  suspend_user_platform: "Suspended user",
  unsuspend_user_platform: "Unsuspended user",
  soft_delete_user_platform: "Soft-deleted user",
};

const ACTION_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  hide_post: "secondary",
  unhide_post: "outline",
  delete_post: "destructive",
  hide_comment: "secondary",
  unhide_comment: "outline",
  delete_comment: "destructive",
  dismiss_flags: "outline",
  warn_member: "secondary",
  suspend_member: "destructive",
  unsuspend_member: "outline",
  remove_member: "destructive",
  warn_user_platform: "secondary",
  suspend_user_platform: "destructive",
  unsuspend_user_platform: "outline",
  soft_delete_user_platform: "destructive",
};

function parseDateBoundary(value: string | undefined, boundary: "start" | "end") {
  if (!value) return undefined;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return undefined;
  if (boundary === "end") {
    date.setHours(23, 59, 59, 999);
  }
  return date;
}

function buildPageUrl(params: {
  page: number;
  action?: string;
  moderator?: string;
  community?: string;
  from?: string;
  to?: string;
}) {
  const nextParams = new URLSearchParams();

  if (params.page > 1) nextParams.set("page", String(params.page));
  if (params.action) nextParams.set("action", params.action);
  if (params.moderator) nextParams.set("moderator", params.moderator);
  if (params.community) nextParams.set("community", params.community);
  if (params.from) nextParams.set("from", params.from);
  if (params.to) nextParams.set("to", params.to);

  const queryString = nextParams.toString();
  return queryString
    ? `/platform/moderation/log?${queryString}`
    : "/platform/moderation/log";
}

export default async function PlatformModerationLogPage({ searchParams }: Props) {
  const {
    action,
    moderator,
    community,
    from,
    to,
    page: pageParam,
  } = await searchParams;

  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);
  const limit = 30;
  const offset = (page - 1) * limit;

  const [communities, moderators, { actions, total }] = await Promise.all([
    getPlatformModerationCommunities(),
    getPlatformModerators({ communityId: community || undefined }),
    getPlatformModerationLog({
      limit,
      offset,
      action: action || undefined,
      moderatorId: moderator || undefined,
      communityId: community || undefined,
      dateFrom: parseDateBoundary(from, "start"),
      dateTo: parseDateBoundary(to, "end"),
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Link
          href="/platform/moderation"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to moderation
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ScrollText className="h-4 w-4" />
              Global moderation log
            </CardTitle>
            <CardDescription>
              Review moderation actions taken across all communities and
              platform-wide user enforcement.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-6" method="get">
              <div className="space-y-1">
                <label htmlFor="action" className="text-xs font-medium text-muted-foreground">
                  Action
                </label>
                <select
                  id="action"
                  name="action"
                  defaultValue={action ?? ""}
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
                >
                  <option value="">All actions</option>
                  {PLATFORM_MODERATION_ACTIONS.map((value) => (
                    <option key={value} value={value}>
                      {ACTION_LABELS[value] ?? value}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="moderator" className="text-xs font-medium text-muted-foreground">
                  Moderator
                </label>
                <select
                  id="moderator"
                  name="moderator"
                  defaultValue={moderator ?? ""}
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
                >
                  <option value="">All moderators</option>
                  {moderators.map((item) => (
                    <option key={item.moderatorId} value={item.moderatorId}>
                      {item.displayName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="community" className="text-xs font-medium text-muted-foreground">
                  Community
                </label>
                <select
                  id="community"
                  name="community"
                  defaultValue={community ?? ""}
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
                >
                  <option value="">All communities</option>
                  {communities.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="from" className="text-xs font-medium text-muted-foreground">
                  From
                </label>
                <Input id="from" name="from" type="date" defaultValue={from ?? ""} />
              </div>

              <div className="space-y-1">
                <label htmlFor="to" className="text-xs font-medium text-muted-foreground">
                  To
                </label>
                <Input id="to" name="to" type="date" defaultValue={to ?? ""} />
              </div>

              <div className="flex items-end gap-2">
                <button
                  type="submit"
                  className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground"
                >
                  Apply
                </button>
                <Link
                  href="/platform/moderation/log"
                  className="inline-flex h-8 items-center justify-center rounded-lg border px-3 text-sm"
                >
                  Reset
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="space-y-3 pt-4">
          {actions.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No moderation actions match the current filters.
            </div>
          ) : (
            actions.map((entry) => (
              <div
                key={entry.id}
                className="flex flex-col gap-3 rounded-xl border px-4 py-3 xl:flex-row xl:items-center xl:justify-between"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant={ACTION_VARIANTS[entry.action] ?? "outline"}
                      className="text-xs"
                    >
                      {ACTION_LABELS[entry.action] ?? entry.action}
                    </Badge>
                    <span className="text-sm">
                      {entry.moderatorDisplayName}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      on {entry.targetType}
                    </span>
                    {entry.targetDisplayName && (
                      <span className="text-sm text-muted-foreground">
                        · {entry.targetDisplayName}
                      </span>
                    )}
                    <Badge variant="outline">
                      {entry.communityName ?? "Platform-wide"}
                    </Badge>
                  </div>
                  {entry.reason && (
                    <p className="text-sm text-muted-foreground">
                      {entry.reason}
                    </p>
                  )}
                </div>

                <time
                  dateTime={entry.createdAt.toISOString()}
                  className="text-xs text-muted-foreground"
                >
                  {entry.createdAt.toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </time>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={buildPageUrl({
                page: page - 1,
                action: action || undefined,
                moderator: moderator || undefined,
                community: community || undefined,
                from: from || undefined,
                to: to || undefined,
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
                action: action || undefined,
                moderator: moderator || undefined,
                community: community || undefined,
                from: from || undefined,
                to: to || undefined,
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
