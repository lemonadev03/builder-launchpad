"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface MemberModActionsProps {
  communitySlug: string;
  userId: string;
  status: "active" | "suspended";
}

export function MemberModActions({
  communitySlug,
  userId,
  status,
}: MemberModActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleAction(action: string) {
    const labels: Record<string, string> = {
      warn: "Send a warning to this member?",
      suspend: "Suspend this member? They will not be able to access the community.",
      unsuspend: "Unsuspend this member?",
      remove: "Remove this member from the community? This cannot be undone.",
    };

    if (!window.confirm(labels[action] ?? "Are you sure?")) return;

    setLoading(true);
    const res = await fetch(
      `/api/communities/${communitySlug}/moderation/members`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, userId }),
      },
    );

    if (res.ok) {
      const actionLabels: Record<string, string> = {
        warn: "Warning issued",
        suspend: "Member suspended",
        unsuspend: "Member unsuspended",
        remove: "Member removed",
      };
      toast.success(actionLabels[action] ?? "Done");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Action failed");
    }
    setLoading(false);
  }

  if (status === "suspended") {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleAction("unsuspend")}
        disabled={loading}
        className="h-7 text-xs"
      >
        Unsuspend
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleAction("warn")}
        disabled={loading}
        className="h-7 text-xs"
      >
        Warn
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleAction("suspend")}
        disabled={loading}
        className="h-7 text-xs text-destructive hover:text-destructive"
      >
        Suspend
      </Button>
    </div>
  );
}
