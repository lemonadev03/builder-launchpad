import { notFound } from "next/navigation";
import Link from "next/link";
import { ScrollText, ArrowLeft } from "lucide-react";
import { requireSession } from "@/lib/session";
import { getCommunityBySlug } from "@/lib/queries/community";
import { getAllDescendants } from "@/lib/queries/community-tree";
import { hasPermission } from "@/lib/permissions";
import { getModerationLog, getModeratorList } from "@/lib/queries/moderation";
import { Badge } from "@/components/ui/badge";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    action?: string;
    moderator?: string;
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
};

export default async function AdminModerationLogPage({
  params,
  searchParams,
}: Props) {
  const { slug } = await params;
  const {
    action: filterAction,
    moderator: filterModerator,
    page: pageParam,
  } = await searchParams;
  const session = await requireSession();

  const c = await getCommunityBySlug(slug);
  if (!c || c.archivedAt) notFound();

  const canManage = await hasPermission(
    session.user.id,
    c.id,
    "community.manage_settings",
  );
  if (!canManage) notFound();

  const descendants = await getAllDescendants(c.id);
  const allCommunityIds = [c.id, ...descendants.map((d) => d.id)];

  const page = Math.max(1, parseInt(pageParam ?? "1", 10));
  const limit = 30;
  const offset = (page - 1) * limit;

  const [{ actions, total }, moderators] = await Promise.all([
    getModerationLog(allCommunityIds, {
      limit,
      offset,
      action: filterAction,
      moderatorId: filterModerator,
    }),
    getModeratorList(allCommunityIds),
  ]);

  const totalPages = Math.ceil(total / limit);
  const basePath = `/admin/${slug}/moderation/log`;

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/admin/${slug}/moderation`}
          className="mb-3 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to moderation
        </Link>
        <div className="flex items-center gap-2">
          <ScrollText className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Moderation Log</h2>
          <span className="text-sm text-muted-foreground">({total})</span>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-4">
        <div>
          <p className="mb-1 text-xs font-medium text-muted-foreground">
            Action
          </p>
          <div className="flex flex-wrap gap-1">
            <Link
              href={`${basePath}${filterModerator ? `?moderator=${filterModerator}` : ""}`}
              className={`rounded-md px-2 py-1 text-xs transition-colors ${
                !filterAction
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              All
            </Link>
            {Object.entries(ACTION_LABELS).map(([key, label]) => (
              <Link
                key={key}
                href={`${basePath}?action=${key}${filterModerator ? `&moderator=${filterModerator}` : ""}`}
                className={`rounded-md px-2 py-1 text-xs transition-colors ${
                  filterAction === key
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        {moderators.length > 1 && (
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">
              Moderator
            </p>
            <div className="flex flex-wrap gap-1">
              <Link
                href={`${basePath}${filterAction ? `?action=${filterAction}` : ""}`}
                className={`rounded-md px-2 py-1 text-xs transition-colors ${
                  !filterModerator
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                All
              </Link>
              {moderators.map((m) => (
                <Link
                  key={m.moderatorId}
                  href={`${basePath}?moderator=${m.moderatorId}${filterAction ? `&action=${filterAction}` : ""}`}
                  className={`rounded-md px-2 py-1 text-xs transition-colors ${
                    filterModerator === m.moderatorId
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {m.displayName}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {actions.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          No moderation actions recorded.
        </p>
      ) : (
        <div className="space-y-2">
          {actions.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between rounded-lg border px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <Badge
                  variant={ACTION_VARIANTS[a.action] ?? "outline"}
                  className="text-xs"
                >
                  {ACTION_LABELS[a.action] ?? a.action}
                </Badge>
                <div>
                  <span className="text-sm">{a.moderatorDisplayName}</span>
                  {a.reason && (
                    <p className="text-xs text-muted-foreground">{a.reason}</p>
                  )}
                </div>
              </div>
              <time
                dateTime={a.createdAt.toISOString()}
                className="text-xs text-muted-foreground"
              >
                {a.createdAt.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </time>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={`${basePath}?page=${page - 1}${filterAction ? `&action=${filterAction}` : ""}${filterModerator ? `&moderator=${filterModerator}` : ""}`}
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
              href={`${basePath}?page=${page + 1}${filterAction ? `&action=${filterAction}` : ""}${filterModerator ? `&moderator=${filterModerator}` : ""}`}
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
