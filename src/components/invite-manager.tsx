"use client";

import { useState } from "react";
import { Copy, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Invite {
  id: string;
  token: string;
  createdAt: Date;
}

interface InviteManagerProps {
  initialInvites: Invite[];
  communitySlug: string;
}

export function InviteManager({
  initialInvites,
  communitySlug,
}: InviteManagerProps) {
  const [invites, setInvites] = useState(initialInvites);
  const [creating, setCreating] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);

  function getInviteUrl(token: string) {
    return `${window.location.origin}/invite/${token}`;
  }

  async function handleCreate() {
    setCreating(true);
    try {
      const res = await fetch(`/api/communities/${communitySlug}/invites`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to create invite");
        return;
      }

      const { invite } = await res.json();
      setInvites((prev) => [...prev, invite]);

      // Copy the link immediately
      await navigator.clipboard.writeText(getInviteUrl(invite.token));
      toast.success("Invite link created and copied");
    } catch {
      toast.error("Failed to create invite");
    } finally {
      setCreating(false);
    }
  }

  async function handleCopy(token: string) {
    try {
      await navigator.clipboard.writeText(getInviteUrl(token));
      toast.success("Link copied");
    } catch {
      toast.error("Failed to copy link");
    }
  }

  async function handleRevoke(inviteId: string) {
    setRevoking(inviteId);
    try {
      const res = await fetch(`/api/communities/${communitySlug}/invites`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteId }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to revoke invite");
        return;
      }

      setInvites((prev) => prev.filter((i) => i.id !== inviteId));
      toast.success("Invite revoked");
    } catch {
      toast.error("Failed to revoke invite");
    } finally {
      setRevoking(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Invite Links</h2>
          <p className="text-sm text-muted-foreground">
            Generate links to share with people you want to invite.
          </p>
        </div>
        <Button onClick={handleCreate} disabled={creating} size="sm">
          {creating && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
          Generate Link
        </Button>
      </div>

      {invites.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No active invite links. Generate one to start inviting members.
        </p>
      ) : (
        <div className="space-y-2">
          {invites.map((inv) => (
            <div
              key={inv.id}
              className="flex items-center gap-3 rounded-lg border px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-sm text-muted-foreground">
                  /invite/{inv.token}
                </p>
                <p className="text-xs text-muted-foreground">
                  Created{" "}
                  {new Date(inv.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>

              <Badge variant="outline">No expiry</Badge>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleCopy(inv.token)}
                title="Copy link"
              >
                <Copy className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRevoke(inv.id)}
                disabled={revoking === inv.id}
                title="Revoke"
                className="text-destructive hover:text-destructive"
              >
                {revoking === inv.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
