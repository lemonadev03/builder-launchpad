"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RotateCcw, CircleSlash, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { PlatformUserStatus } from "@/lib/queries/platform-user";

type PlatformUserAction = "suspend" | "unsuspend" | "delete";

interface PlatformUserActionsProps {
  userId: string;
  userLabel: string;
  status: PlatformUserStatus;
  compact?: boolean;
}

const CONFIRMATIONS: Record<PlatformUserAction, string> = {
  suspend: "Suspend this user platform-wide? They will be blocked from using Builder Launchpad.",
  unsuspend: "Unsuspend this user and restore access?",
  delete: "Soft-delete this user? This will anonymize profile data and revoke active sessions.",
};

export function PlatformUserActions({
  userId,
  userLabel,
  status,
  compact = false,
}: PlatformUserActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<PlatformUserAction | null>(null);

  async function handleAction(action: PlatformUserAction) {
    if (!window.confirm(CONFIRMATIONS[action])) return;

    setLoading(action);

    try {
      const response = await fetch(`/api/platform/users/${userId}`, {
        method: action === "delete" ? "DELETE" : "PATCH",
        headers:
          action === "delete"
            ? undefined
            : {
                "Content-Type": "application/json",
              },
        body:
          action === "delete"
            ? undefined
            : JSON.stringify({ action }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        toast.error(data?.error || "Action failed");
        return;
      }

      if (action === "delete") {
        toast.success(`Deleted ${userLabel}`);
      } else if (action === "suspend") {
        toast.success(`Suspended ${userLabel}`);
      } else {
        toast.success(`Unsuspended ${userLabel}`);
      }

      router.refresh();
    } catch {
      toast.error("Action failed");
    } finally {
      setLoading(null);
    }
  }

  if (status === "deleted") {
    return null;
  }

  const buttons =
    status === "suspended"
      ? [
          {
            action: "unsuspend" as const,
            label: "Unsuspend",
            icon: RotateCcw,
            variant: "outline" as const,
          },
          {
            action: "delete" as const,
            label: "Delete",
            icon: Trash2,
            variant: "ghost" as const,
          },
        ]
      : [
          {
            action: "suspend" as const,
            label: "Suspend",
            icon: CircleSlash,
            variant: "outline" as const,
          },
          {
            action: "delete" as const,
            label: "Delete",
            icon: Trash2,
            variant: "ghost" as const,
          },
        ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {buttons.map((button) => {
        const Icon = button.icon;
        const busy = loading === button.action;

        return (
          <Button
            key={button.action}
            type="button"
            size={compact ? "sm" : "default"}
            variant={button.variant}
            disabled={loading !== null}
            onClick={() => handleAction(button.action)}
          >
            {busy ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Icon className="mr-2 h-4 w-4" />
            )}
            {button.label}
          </Button>
        );
      })}
    </div>
  );
}
