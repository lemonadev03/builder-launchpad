"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Member {
  id: string;
  userId: string;
  role: string;
  status: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  joinedAt: Date;
}

interface MembersTableProps {
  members: Member[];
  communitySlug: string;
  currentUserId: string;
}

const ROLES = ["admin", "moderator", "member"] as const;

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function roleBadgeVariant(role: string) {
  if (role === "admin") return "default";
  if (role === "moderator") return "secondary";
  return "outline";
}

export function MembersTable({
  members: initialMembers,
  communitySlug,
  currentUserId,
}: MembersTableProps) {
  const [members, setMembers] = useState(initialMembers);
  const [loading, setLoading] = useState<string | null>(null);

  async function handleRoleChange(userId: string, newRole: string) {
    setLoading(userId);
    try {
      const res = await fetch(
        `/api/communities/${communitySlug}/members/${userId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: newRole }),
        },
      );

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to update role");
        return;
      }

      setMembers((prev) =>
        prev.map((m) => (m.userId === userId ? { ...m, role: newRole } : m)),
      );
      toast.success("Role updated");
    } catch {
      toast.error("Failed to update role");
    } finally {
      setLoading(null);
    }
  }

  async function handleSuspend(userId: string, displayName: string) {
    if (!confirm(`Suspend ${displayName}? They will not be able to access community content.`)) return;

    setLoading(userId);
    try {
      const res = await fetch(
        `/api/communities/${communitySlug}/members/${userId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "suspend" }),
        },
      );

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to suspend");
        return;
      }

      setMembers((prev) =>
        prev.map((m) =>
          m.userId === userId ? { ...m, status: "suspended" } : m,
        ),
      );
      toast.success(`${displayName} suspended`);
    } catch {
      toast.error("Failed to suspend");
    } finally {
      setLoading(null);
    }
  }

  async function handleUnsuspend(userId: string, displayName: string) {
    setLoading(userId);
    try {
      const res = await fetch(
        `/api/communities/${communitySlug}/members/${userId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "unsuspend" }),
        },
      );

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to unsuspend");
        return;
      }

      setMembers((prev) =>
        prev.map((m) =>
          m.userId === userId ? { ...m, status: "active" } : m,
        ),
      );
      toast.success(`${displayName} unsuspended`);
    } catch {
      toast.error("Failed to unsuspend");
    } finally {
      setLoading(null);
    }
  }

  async function handleRemove(userId: string, displayName: string) {
    if (!confirm(`Remove ${displayName} from this community?`)) return;

    setLoading(userId);
    try {
      const res = await fetch(
        `/api/communities/${communitySlug}/members/${userId}`,
        { method: "DELETE" },
      );

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to remove member");
        return;
      }

      setMembers((prev) => prev.filter((m) => m.userId !== userId));
      toast.success(`${displayName} removed`);
    } catch {
      toast.error("Failed to remove member");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-1">
      {members.map((m) => {
        const isSelf = m.userId === currentUserId;
        const isLoading = loading === m.userId;
        const isSuspended = m.status === "suspended";

        return (
          <div
            key={m.id}
            className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${isSuspended ? "opacity-60" : ""}`}
          >
            <Avatar>
              {m.avatarUrl ? (
                <AvatarImage src={m.avatarUrl} alt={m.displayName} />
              ) : null}
              <AvatarFallback>{getInitials(m.displayName)}</AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{m.displayName}</p>
              <p className="truncate text-xs text-muted-foreground">
                @{m.username}
              </p>
            </div>

            {isSuspended && (
              <Badge variant="destructive" className="text-xs">
                Suspended
              </Badge>
            )}

            {isSelf ? (
              <Badge variant={roleBadgeVariant(m.role)}>
                {m.role}{" "}
                <span className="ml-1 text-muted-foreground">(you)</span>
              </Badge>
            ) : (
              <>
                {!isSuspended && (
                  <select
                    value={m.role}
                    onChange={(e) => handleRoleChange(m.userId, e.target.value)}
                    disabled={isLoading}
                    className="h-8 rounded-md border bg-background px-2 text-xs"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                )}

                {isSuspended ? (
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => handleUnsuspend(m.userId, m.displayName)}
                    disabled={isLoading}
                  >
                    Unsuspend
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => handleSuspend(m.userId, m.displayName)}
                    disabled={isLoading}
                    className="text-amber-600 hover:text-amber-600"
                  >
                    Suspend
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => handleRemove(m.userId, m.displayName)}
                  disabled={isLoading}
                  className="text-destructive hover:text-destructive"
                >
                  Remove
                </Button>
              </>
            )}
          </div>
        );
      })}

      {members.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No members yet.
        </p>
      )}
    </div>
  );
}
