import { notFound } from "next/navigation";
import Link from "next/link";
import { Shield, AlertTriangle, UserX } from "lucide-react";
import { requireSession } from "@/lib/session";
import { getCommunityBySlug } from "@/lib/queries/community";
import { getAllDescendants } from "@/lib/queries/community-tree";
import { hasPermission } from "@/lib/permissions";
import {
  getFlagsByCommunity,
  getOpenFlagCount,
  getFlaggedPostPreview,
  getFlaggedCommentPreview,
} from "@/lib/queries/flag";
import { getSuspendedMembers } from "@/lib/queries/membership";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ community?: string }>;
}

const REASON_LABELS: Record<string, string> = {
  spam: "Spam",
  harassment: "Harassment",
  off_topic: "Off-topic",
  other: "Other",
};

function extractPlainText(content: unknown): string {
  if (!content || typeof content !== "object") return "";
  const doc = content as { content?: Array<{ content?: Array<{ text?: string }> }> };
  return (
    doc.content
      ?.flatMap((node) => node.content?.map((c) => c.text ?? "") ?? [])
      .join(" ")
      .slice(0, 120) || ""
  );
}

export default async function ModerationPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { community: filterCommunity } = await searchParams;
  const session = await requireSession();

  const c = await getCommunityBySlug(slug);
  if (!c || c.archivedAt) notFound();

  const canModerate = await hasPermission(
    session.user.id,
    c.id,
    "content.moderate",
  );
  if (!canModerate) notFound();

  // Get this community + all descendants for cascade
  const descendants = await getAllDescendants(c.id);
  const allCommunityIds = [c.id, ...descendants.map((d) => d.id)];

  // Apply sub-community filter
  const filteredIds = filterCommunity
    ? allCommunityIds.filter((id) => id === filterCommunity)
    : allCommunityIds;

  const [{ flags, total: flagTotal }, openCount, suspendedMembers] =
    await Promise.all([
      getFlagsByCommunity(filteredIds, {
        status: "open",
        limit: 50,
        offset: 0,
      }),
      getOpenFlagCount(allCommunityIds),
      getSuspendedMembers(allCommunityIds),
    ]);

  // Enrich flags with target previews
  const enrichedFlags = await Promise.all(
    flags.map(async (f) => {
      if (f.targetType === "post") {
        const preview = await getFlaggedPostPreview(f.targetId);
        return { ...f, preview };
      } else {
        const preview = await getFlaggedCommentPreview(f.targetId);
        return { ...f, preview };
      }
    }),
  );

  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        <Shield className="h-5 w-5" />
        <h2 className="text-lg font-semibold">Moderation</h2>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="rounded-lg border p-4">
          <p className="text-2xl font-bold">{openCount}</p>
          <p className="text-sm text-muted-foreground">
            Open flag{openCount !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-2xl font-bold">{suspendedMembers.length}</p>
          <p className="text-sm text-muted-foreground">
            Suspended member{suspendedMembers.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Sub-community filter */}
      {descendants.length > 0 && (
        <div className="mb-6">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Filter by community
          </p>
          <div className="flex flex-wrap gap-1.5">
            <Link
              href={`/communities/${slug}/manage/moderation`}
              className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                !filterCommunity
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              All
            </Link>
            <Link
              href={`/communities/${slug}/manage/moderation?community=${c.id}`}
              className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                filterCommunity === c.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {c.name}
            </Link>
            {descendants.map((d) => (
              <Link
                key={d.id}
                href={`/communities/${slug}/manage/moderation?community=${d.id}`}
                className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                  filterCommunity === d.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {d.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Flagged content queue */}
      <div className="mb-8">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <AlertTriangle className="h-4 w-4" />
          Flagged Content ({flagTotal})
        </h3>

        {enrichedFlags.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            No open flags.
          </p>
        ) : (
          <div className="space-y-3">
            {enrichedFlags.map((f) => (
              <div
                key={f.id}
                className="rounded-lg border p-4"
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {f.targetType}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {REASON_LABELS[f.reason] ?? f.reason}
                    </Badge>
                    {f.communityName !== c.name && (
                      <span className="text-xs text-muted-foreground">
                        in {f.communityName}
                      </span>
                    )}
                  </div>
                  <time
                    dateTime={f.createdAt.toISOString()}
                    className="text-xs text-muted-foreground"
                  >
                    {f.createdAt.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </time>
                </div>

                {/* Content preview */}
                <div className="mb-2 rounded-md bg-muted/50 px-3 py-2">
                  {f.targetType === "post" && f.preview ? (
                    <Link
                      href={`/communities/${(f.preview as { communitySlug: string }).communitySlug}/posts/${(f.preview as { slug: string }).slug}`}
                      className="text-sm font-medium hover:underline"
                    >
                      {(f.preview as { title: string }).title}
                    </Link>
                  ) : f.targetType === "comment" && f.preview ? (
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Comment on{" "}
                        <Link
                          href={`/communities/${(f.preview as { communitySlug: string }).communitySlug}/posts/${(f.preview as { postSlug: string }).postSlug}`}
                          className="hover:underline"
                        >
                          {(f.preview as { postTitle: string }).postTitle}
                        </Link>
                      </p>
                      <p className="mt-1 text-sm">
                        {extractPlainText((f.preview as { content: unknown }).content)}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      Content not found
                    </p>
                  )}
                </div>

                {f.description && (
                  <p className="mb-2 text-xs text-muted-foreground">
                    &ldquo;{f.description}&rdquo;
                  </p>
                )}

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Avatar className="h-4 w-4">
                    {f.reporterAvatarUrl ? (
                      <AvatarImage src={f.reporterAvatarUrl} />
                    ) : null}
                    <AvatarFallback className="text-[8px]">
                      {f.reporterDisplayName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span>
                    Reported by {f.reporterDisplayName}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Suspended members */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <UserX className="h-4 w-4" />
          Suspended Members ({suspendedMembers.length})
        </h3>

        {suspendedMembers.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            No suspended members.
          </p>
        ) : (
          <div className="space-y-2">
            {suspendedMembers.map((m) => (
              <div
                key={m.membershipId}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    {m.avatarUrl ? (
                      <AvatarImage src={m.avatarUrl} alt={m.displayName} />
                    ) : null}
                    <AvatarFallback className="text-xs">
                      {m.displayName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{m.displayName}</p>
                    <p className="text-xs text-muted-foreground">
                      @{m.username}
                      {m.communityName !== c.name &&
                        ` · ${m.communityName}`}
                    </p>
                  </div>
                </div>
                <Badge variant="destructive" className="text-xs">
                  Suspended
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
