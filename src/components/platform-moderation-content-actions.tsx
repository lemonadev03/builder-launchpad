"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, EyeOff, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface PlatformModerationContentActionsProps {
  targetType: "post" | "comment";
  targetId: string;
}

const CONFIRMATIONS: Record<string, string> = {
  dismiss_flags: "Dismiss all flags on this content?",
  hide: "Hide this content?",
  delete: "Delete this content? This cannot be undone.",
};

export function PlatformModerationContentActions({
  targetType,
  targetId,
}: PlatformModerationContentActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function handleAction(action: "dismiss_flags" | "hide" | "delete") {
    if (!window.confirm(CONFIRMATIONS[action])) return;

    setLoading(action);

    try {
      const response = await fetch("/api/platform/moderation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action, targetType, targetId }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        toast.error(data?.error || "Action failed");
        return;
      }

      toast.success(
        action === "dismiss_flags"
          ? "Flags dismissed"
          : action === "hide"
            ? "Content hidden"
            : "Content deleted",
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
        variant="ghost"
        size="sm"
        disabled={loading !== null}
        onClick={() => handleAction("dismiss_flags")}
      >
        <CheckCircle className="mr-2 h-4 w-4" />
        Dismiss
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={loading !== null}
        onClick={() => handleAction("hide")}
      >
        <EyeOff className="mr-2 h-4 w-4" />
        Hide
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={loading !== null}
        onClick={() => handleAction("delete")}
        className="text-destructive hover:text-destructive"
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Delete
      </Button>
    </div>
  );
}
