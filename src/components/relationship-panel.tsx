"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Link2, Users, X } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { TreeNode } from "@/lib/queries/community-tree";

// Mirror of MAX_DEPTH from community-tree.ts (server-only module, can't import the value)
const MAX_COMMUNITY_DEPTH = 3;
import type { PlatformSisterLink } from "@/lib/queries/sister";
import { AddSisterLinkDialog } from "@/components/add-sister-link-dialog";
import { AddChildDialog } from "@/components/add-child-dialog";

interface RelationshipPanelProps {
  node: TreeNode | null;
  trees: TreeNode[];
  sisterLinks: PlatformSisterLink[];
  onClose: () => void;
}

export function RelationshipPanel({
  node,
  trees,
  sisterLinks,
  onClose,
}: RelationshipPanelProps) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  if (!node) {
    return (
      <div className="hidden w-80 shrink-0 border-l border-border p-6 lg:flex lg:items-center lg:justify-center">
        <p className="text-center text-sm text-muted-foreground">
          Select a community to manage its relationships.
        </p>
      </div>
    );
  }

  // Sister links involving this node
  const nodeLinks = sisterLinks.filter(
    (l) => l.communityAId === node.id || l.communityBId === node.id,
  );
  const activeLinks = nodeLinks.filter((l) => l.status === "active");
  const pendingInbound = nodeLinks.filter(
    (l) => l.status === "pending" && l.requestedCommunityId !== node.id,
  );
  const pendingOutbound = nodeLinks.filter(
    (l) => l.status === "pending" && l.requestedCommunityId === node.id,
  );

  function otherName(link: PlatformSisterLink) {
    return link.communityAId === node!.id
      ? link.communityBName
      : link.communityAName;
  }

  async function handleRemove(linkId: string) {
    setBusy(linkId);
    try {
      const res = await fetch(
        `/api/communities/${node!.slug}/sisters/${linkId}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to remove");
        return;
      }
      toast.success("Sister link removed");
      router.refresh();
    } catch {
      toast.error("Failed to remove");
    } finally {
      setBusy(null);
    }
  }

  async function handleRespond(linkId: string, action: "accept" | "decline") {
    setBusy(linkId);
    try {
      const res = await fetch(
        `/api/communities/${node!.slug}/sisters/${linkId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        },
      );
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || `Failed to ${action}`);
        return;
      }
      toast.success(action === "accept" ? "Sister link accepted" : "Request declined");
      router.refresh();
    } catch {
      toast.error(`Failed to ${action}`);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="hidden w-80 shrink-0 overflow-y-auto border-l border-border lg:block">
      <div className="space-y-5 p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              {node.logoUrl ? (
                <AvatarImage src={node.logoUrl} alt={node.name} />
              ) : null}
              <AvatarFallback className="text-sm">
                {node.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{node.name}</p>
              <p className="text-xs text-muted-foreground">
                Depth {node.depth} &middot; {node.memberCount} member
                {node.memberCount !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Sister Links */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">
              <Link2 className="h-3.5 w-3.5" />
              Sister Links
            </h3>
            <AddSisterLinkDialog node={node} trees={trees} existingLinks={nodeLinks} />
          </div>

          {activeLinks.length === 0 &&
            pendingInbound.length === 0 &&
            pendingOutbound.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No sister links yet.
              </p>
            )}

          {/* Active */}
          {activeLinks.map((link) => (
            <div
              key={link.linkId}
              className="flex items-center justify-between rounded-md border px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{otherName(link)}</p>
                <Badge variant="outline" className="mt-0.5 text-[10px]">
                  Active
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-destructive hover:text-destructive"
                disabled={busy === link.linkId}
                onClick={() => handleRemove(link.linkId)}
              >
                Remove
              </Button>
            </div>
          ))}

          {/* Pending inbound */}
          {pendingInbound.map((link) => (
            <div
              key={link.linkId}
              className="rounded-md border border-amber-500/30 px-3 py-2"
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {otherName(link)}
                  </p>
                  <Badge
                    variant="outline"
                    className="mt-0.5 border-amber-500/30 text-[10px] text-amber-600"
                  >
                    Incoming request
                  </Badge>
                </div>
              </div>
              <div className="mt-2 flex gap-2">
                <Button
                  size="sm"
                  className="h-7 text-xs"
                  disabled={busy === link.linkId}
                  onClick={() => handleRespond(link.linkId, "accept")}
                >
                  Accept
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  disabled={busy === link.linkId}
                  onClick={() => handleRespond(link.linkId, "decline")}
                >
                  Decline
                </Button>
              </div>
            </div>
          ))}

          {/* Pending outbound */}
          {pendingOutbound.map((link) => (
            <div
              key={link.linkId}
              className="flex items-center justify-between rounded-md border px-3 py-2 opacity-70"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{otherName(link)}</p>
                <Badge
                  variant="outline"
                  className="mt-0.5 border-amber-500/30 text-[10px] text-amber-600"
                >
                  Waiting for approval
                </Badge>
              </div>
            </div>
          ))}
        </section>

        {/* Children */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              Children ({node.children.length})
            </h3>
            {node.depth < MAX_COMMUNITY_DEPTH && !node.isArchived && (
              <AddChildDialog
                parentId={node.id}
                tierLabel={node.subTierLabel ?? "Sub-community"}
              />
            )}
          </div>

          {node.children.length === 0 ? (
            <p className="text-xs text-muted-foreground">No children.</p>
          ) : (
            node.children.map((child) => (
              <div
                key={child.id}
                className="flex items-center gap-2 rounded-md border px-3 py-2"
              >
                <Avatar className="h-6 w-6">
                  {child.logoUrl ? (
                    <AvatarImage src={child.logoUrl} alt={child.name} />
                  ) : null}
                  <AvatarFallback className="text-[10px]">
                    {child.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="min-w-0 flex-1 truncate text-sm">
                  {child.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {child.memberCount}
                </span>
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
