"use client";

import { useState } from "react";
import { Copy, Loader2, Mail, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface Invite {
  id: string;
  token: string;
  email: string | null;
  emailStatus: string | null;
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

  // Email invite state
  const [emailText, setEmailText] = useState("");
  const [sendingEmails, setSendingEmails] = useState(false);

  const linkInvites = invites.filter((i) => !i.email);
  const emailInvites = invites.filter((i) => i.email);

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

  async function handleSendEmails() {
    const emails = emailText
      .split(/[,\n]+/)
      .map((e) => e.trim())
      .filter((e) => e.length > 0);

    if (emails.length === 0) {
      toast.error("Enter at least one email address");
      return;
    }

    if (emails.length > 50) {
      toast.error("Maximum 50 emails per batch");
      return;
    }

    setSendingEmails(true);
    try {
      const res = await fetch(
        `/api/communities/${communitySlug}/invites/email`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emails }),
        },
      );

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to send invitations");
        return;
      }

      const { sent, failed } = await res.json();

      if (failed > 0) {
        toast.warning(`${sent} sent, ${failed} failed`);
      } else {
        toast.success(`${sent} invitation${sent !== 1 ? "s" : ""} sent`);
      }

      setEmailText("");

      // Refresh invite list
      const listRes = await fetch(
        `/api/communities/${communitySlug}/invites`,
      );
      if (listRes.ok) {
        const { invites: updated } = await listRes.json();
        setInvites(updated);
      }
    } catch {
      toast.error("Failed to send invitations");
    } finally {
      setSendingEmails(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Email invitations */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Email Invitations</h2>
          <p className="text-sm text-muted-foreground">
            Send invite emails directly. Up to 50 per batch.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="emails">Email addresses</Label>
          <Textarea
            id="emails"
            value={emailText}
            onChange={(e) => setEmailText(e.target.value)}
            placeholder={"alice@example.com\nbob@example.com\ncharlie@example.com"}
            rows={4}
          />
          <p className="text-xs text-muted-foreground">
            Separate with commas or new lines.
          </p>
        </div>

        <Button
          onClick={handleSendEmails}
          disabled={sendingEmails || !emailText.trim()}
          size="sm"
        >
          {sendingEmails ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <Mail className="mr-1.5 h-4 w-4" />
          )}
          Send Invitations
        </Button>

        {emailInvites.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Sent Invitations
            </p>
            {emailInvites.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center gap-3 rounded-lg border px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{inv.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Sent{" "}
                    {new Date(inv.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <Badge
                  variant={
                    inv.emailStatus === "redeemed" ? "default" : "outline"
                  }
                >
                  {inv.emailStatus === "redeemed" ? "Joined" : "Pending"}
                </Badge>
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

      <Separator />

      {/* Link invitations */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Invite Links</h2>
            <p className="text-sm text-muted-foreground">
              Generate links to share via Discord, Facebook, etc.
            </p>
          </div>
          <Button onClick={handleCreate} disabled={creating} size="sm">
            {creating && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            Generate Link
          </Button>
        </div>

        {linkInvites.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No active invite links.
          </p>
        ) : (
          <div className="space-y-2">
            {linkInvites.map((inv) => (
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
    </div>
  );
}
