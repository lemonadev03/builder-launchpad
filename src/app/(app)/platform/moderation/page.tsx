import Link from "next/link";
import { AlertTriangle, ExternalLink, ScrollText, Shield } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PlatformModerationContentActions } from "@/components/platform-moderation-content-actions";
import { PlatformModerationMemberActions } from "@/components/platform-moderation-member-actions";
import { PlatformUserStatusBadge } from "@/components/platform-user-status-badge";
import {
  getFlaggedCommentPreviewsBatch,
  getFlaggedPostPreviewsBatch,
  getPlatformFlags,
  getPlatformOpenFlagCount,
  listCommunitiesWithOpenFlags,
} from "@/lib/queries/flag";

interface Props {
  searchParams: Promise<{
    page?: string;
    community?: string;
    reason?: string;
    from?: string;
    to?: string;
  }>;
}

const REASON_LABELS: Record<string, string> = {
  spam: "Spam",
  harassment: "Harassment",
  off_topic: "Off-topic",
  other: "Other",
};

type FlagReason = "spam" | "harassment" | "off_topic" | "other";

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
  community?: string;
  reason?: string;
  from?: string;
  to?: string;
}) {
  const nextParams = new URLSearchParams();

  if (params.page > 1) nextParams.set("page", String(params.page));
  if (params.community) nextParams.set("community", params.community);
  if (params.reason) nextParams.set("reason", params.reason);
  if (params.from) nextParams.set("from", params.from);
  if (params.to) nextParams.set("to", params.to);

  const queryString = nextParams.toString();
  return queryString ? `/platform/moderation?${queryString}` : "/platform/moderation";
}

function extractPlainText(content: unknown): string {
  if (!content || typeof content !== "object") return "";
  const doc = content as { content?: Array<{ content?: Array<{ text?: string }> }> };
  return (
    doc.content
      ?.flatMap((node) => node.content?.map((child) => child.text ?? "") ?? [])
      .join(" ")
      .slice(0, 140) || ""
  );
}

function getAuthorStatus(userRow: {
  authorSuspendedAt?: Date | null;
  authorDeletedAt?: Date | null;
}) {
  if (userRow.authorDeletedAt) return "deleted" as const;
  if (userRow.authorSuspendedAt) return "suspended" as const;
  return "active" as const;
}

export default async function PlatformModerationPage({ searchParams }: Props) {
  const {
    page: pageParam,
    community,
    reason,
    from,
    to,
  } = await searchParams;

  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);
  const limit = 25;
  const offset = (page - 1) * limit;

  const [communities, openCount, flagQueue] = await Promise.all([
    listCommunitiesWithOpenFlags(),
    getPlatformOpenFlagCount(),
    getPlatformFlags({
      status: "open",
      communityId: community || undefined,
      reason:
        reason && Object.hasOwn(REASON_LABELS, reason)
          ? (reason as FlagReason)
          : undefined,
      dateFrom: parseDateBoundary(from, "start"),
      dateTo: parseDateBoundary(to, "end"),
      limit,
      offset,
    }),
  ]);

  const postIds = flagQueue.flags
    .filter((flag) => flag.targetType === "post")
    .map((flag) => flag.targetId);
  const commentIds = flagQueue.flags
    .filter((flag) => flag.targetType === "comment")
    .map((flag) => flag.targetId);

  const [postPreviews, commentPreviews] = await Promise.all([
    getFlaggedPostPreviewsBatch(postIds),
    getFlaggedCommentPreviewsBatch(commentIds),
  ]);

  const totalPages = Math.max(1, Math.ceil(flagQueue.total / limit));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Platform moderation
              </CardTitle>
              <CardDescription>
                Review the global flag queue across all communities and take
                platform-level action on content or repeat offenders.
              </CardDescription>
            </div>
            <Link
              href="/platform/moderation/log"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ScrollText className="h-4 w-4" />
              Global moderation log
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border px-4 py-3">
              <p className="text-2xl font-semibold">{openCount}</p>
              <p className="text-sm text-muted-foreground">Open flags</p>
            </div>
            <div className="rounded-lg border px-4 py-3">
              <p className="text-2xl font-semibold">{communities.length}</p>
              <p className="text-sm text-muted-foreground">
                Communities with open reports
              </p>
            </div>
            <div className="rounded-lg border px-4 py-3">
              <p className="text-2xl font-semibold">{flagQueue.total}</p>
              <p className="text-sm text-muted-foreground">
                Queue items matching current filters
              </p>
            </div>
          </div>

          <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-5" method="get">
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
              <label htmlFor="reason" className="text-xs font-medium text-muted-foreground">
                Reason
              </label>
              <select
                id="reason"
                name="reason"
                defaultValue={reason ?? ""}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
              >
                <option value="">All reasons</option>
                {Object.entries(REASON_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
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
                href="/platform/moderation"
                className="inline-flex h-8 items-center justify-center rounded-lg border px-3 text-sm"
              >
                Reset
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 pt-4">
          {flagQueue.flags.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No open flags match the current filters.
            </div>
          ) : (
            flagQueue.flags.map((flag) => {
              const postPreview =
                flag.targetType === "post"
                  ? postPreviews.get(flag.targetId)
                  : undefined;
              const commentPreview =
                flag.targetType === "comment"
                  ? commentPreviews.get(flag.targetId)
                  : undefined;
              const preview = postPreview ?? commentPreview;
              const authorStatus = preview ? getAuthorStatus(preview) : "active";
              const canModerateAuthor =
                preview &&
                !preview.isPlatformAdmin &&
                authorStatus === "active";

              return (
                <div key={flag.id} className="rounded-xl border p-4">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="capitalize">
                          {flag.targetType}
                        </Badge>
                        <Badge variant="secondary">
                          {REASON_LABELS[flag.reason] ?? flag.reason}
                        </Badge>
                        <Link
                          href={`/platform/communities/${flag.communityId}`}
                          className="text-xs text-muted-foreground hover:text-foreground"
                        >
                          {flag.communityName}
                        </Link>
                        <time
                          dateTime={flag.createdAt.toISOString()}
                          className="text-xs text-muted-foreground"
                        >
                          {flag.createdAt.toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </time>
                      </div>

                      <div className="rounded-lg bg-muted/40 px-3 py-3">
                        {flag.targetType === "post" && postPreview ? (
                          <div className="space-y-1">
                            <Link
                              href={`/communities/${postPreview.communitySlug}/posts/${postPreview.slug}`}
                              className="inline-flex items-center gap-2 font-medium hover:text-primary"
                            >
                              {postPreview.title}
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Link>
                            {postPreview.excerpt && (
                              <p className="text-sm text-muted-foreground">
                                {postPreview.excerpt}
                              </p>
                            )}
                          </div>
                        ) : flag.targetType === "comment" && commentPreview ? (
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">
                              Comment on{" "}
                              <Link
                                href={`/communities/${commentPreview.communitySlug}/posts/${commentPreview.postSlug}`}
                                className="hover:text-foreground"
                              >
                                {commentPreview.postTitle}
                              </Link>
                            </p>
                            <p className="text-sm">
                              {extractPlainText(commentPreview.content)}
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Content is no longer available.
                          </p>
                        )}
                      </div>

                      {flag.description && (
                        <p className="text-sm text-muted-foreground">
                          Reporter note: “{flag.description}”
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <div className="inline-flex items-center gap-2">
                          <Avatar className="h-5 w-5">
                            {flag.reporterAvatarUrl ? (
                              <AvatarImage src={flag.reporterAvatarUrl} />
                            ) : null}
                            <AvatarFallback className="text-[9px]">
                              {flag.reporterDisplayName.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          Reported by {flag.reporterDisplayName}
                        </div>

                        {preview && (
                          <div className="inline-flex items-center gap-2">
                            <span>Author:</span>
                            <Link
                              href={`/platform/users/${preview.authorUserId}`}
                              className="font-medium text-foreground hover:text-primary"
                            >
                              {preview.authorDisplayName}
                            </Link>
                            <PlatformUserStatusBadge status={authorStatus} />
                            {preview.isPlatformAdmin && (
                              <Badge variant="outline">Platform admin</Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex w-full flex-col gap-3 xl:w-auto xl:min-w-[270px]">
                      <div className="rounded-lg border p-3">
                        <p className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                          Content action
                        </p>
                        <PlatformModerationContentActions
                          targetType={flag.targetType}
                          targetId={flag.targetId}
                        />
                      </div>

                      <div className="rounded-lg border p-3">
                        <p className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                          Member action
                        </p>
                        {preview ? (
                          canModerateAuthor ? (
                            <PlatformModerationMemberActions
                              userId={preview.authorUserId}
                              userLabel={preview.authorDisplayName}
                            />
                          ) : preview.isPlatformAdmin ? (
                            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                              <AlertTriangle className="h-4 w-4" />
                              Platform admins cannot be moderated here.
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                              <AlertTriangle className="h-4 w-4" />
                              Author is already {authorStatus}.
                            </div>
                          )
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Author data unavailable.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={buildPageUrl({
                page: page - 1,
                community: community || undefined,
                reason: reason || undefined,
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
                community: community || undefined,
                reason: reason || undefined,
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
