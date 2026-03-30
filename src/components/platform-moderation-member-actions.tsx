"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CircleSlash, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface PlatformModerationMemberActionsProps {
  userId: string;
  userLabel: string;
  disabled?: boolean;
}

const CONFIRMATIONS = {
  warn: "Record a platform warning for this user?",
  suspend:
    "Suspend this user platform-wide? They will be blocked from using Builder Launchpad.",
} as const;

export function PlatformModerationMemberActions({
  userId,
  userLabel,
  disabled = false,
}: PlatformModerationMemberActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<"warn" | "suspend" | null>(null);

  async function handleAction(action: "warn" | "suspend") {
    if (!window.confirm(CONFIRMATIONS[action])) return;

    setLoading(action);

    try {
      const response = await fetch(`/api/platform/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        toast.error(data?.error || "Action failed");
        return;
      }

      toast.success(
        action === "warn" ? `Warned ${userLabel}` : `Suspended ${userLabel}`,
      );
      router.refresh();
    } catch {
      toast.error("Action failed");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || loading !== null}
        onClick={() => handleAction("warn")}
      >
        <TriangleAlert className="mr-2 h-4 w-4" />
        Warn
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || loading !== null}
        onClick={() => handleAction("suspend")}
        className="text-destructive hover:text-destructive"
      >
        <CircleSlash className="mr-2 h-4 w-4" />
        Suspend
      </Button>
    </div>
  );
}
