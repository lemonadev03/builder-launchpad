"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EyeOff, Trash2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface ModerationActionsProps {
  communitySlug: string;
  targetType: "post" | "comment";
  targetId: string;
}

export function ModerationActions({
  communitySlug,
  targetType,
  targetId,
}: ModerationActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function handleAction(action: string) {
    const labels: Record<string, string> = {
      hide: "Hide this content?",
      delete: "Permanently delete this content? This cannot be undone.",
      dismiss_flags: "Dismiss all flags on this content?",
    };

    if (!window.confirm(labels[action] ?? "Are you sure?")) return;

    setLoading(action);
    const res = await fetch(`/api/communities/${communitySlug}/moderation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, targetType, targetId }),
    });

    if (res.ok) {
      const actionLabels: Record<string, string> = {
        hide: "Content hidden",
        delete: "Content deleted",
        dismiss_flags: "Flags dismissed",
      };
      toast.success(actionLabels[action] ?? "Done");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Action failed");
    }
    setLoading(null);
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleAction("dismiss_flags")}
        disabled={loading !== null}
        className="h-7 gap-1 text-xs"
      >
        <CheckCircle className="h-3 w-3" />
        Dismiss
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleAction("hide")}
        disabled={loading !== null}
        className="h-7 gap-1 text-xs"
      >
        <EyeOff className="h-3 w-3" />
        Hide
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleAction("delete")}
        disabled={loading !== null}
        className="h-7 gap-1 text-xs text-destructive hover:text-destructive"
      >
        <Trash2 className="h-3 w-3" />
        Delete
      </Button>
    </div>
  );
}
