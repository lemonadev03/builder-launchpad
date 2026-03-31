"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCcw, Sparkles, StarOff, Archive, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type PlatformCommunityAction = "archive" | "restore" | "feature" | "unfeature" | "delete";

interface PlatformCommunityActionsProps {
  communityId: string;
  communityName: string;
  isArchived: boolean;
  isFeatured: boolean;
  compact?: boolean;
}

const LABELS: Record<PlatformCommunityAction, string> = {
  archive: "Archive",
  restore: "Restore",
  feature: "Feature",
  unfeature: "Unfeature",
  delete: "Delete",
};

const CONFIRMATIONS: Record<PlatformCommunityAction, string> = {
  archive: "Archive this community? It will be hidden from active community surfaces.",
  restore: "Restore this archived community?",
  feature: "Feature this community for platform discovery?",
  unfeature: "Remove this community from featured placement?",
  delete: "PERMANENTLY DELETE this community and all its sub-communities, posts, members, and data? This cannot be undone.",
};

export function PlatformCommunityActions({
  communityId,
  communityName,
  isArchived,
  isFeatured,
  compact = false,
}: PlatformCommunityActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<PlatformCommunityAction | null>(null);

  async function handleAction(action: PlatformCommunityAction) {
    if (!window.confirm(CONFIRMATIONS[action])) return;

    setLoading(action);

    try {
      const response = await fetch(`/api/platform/communities/${communityId}`, {
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

      toast.success(`${LABELS[action]}d ${communityName}`);
      if (action === "delete") {
        router.push("/platform/communities");
        return;
      }
      router.refresh();
    } catch {
      toast.error("Action failed");
    } finally {
      setLoading(null);
    }
  }

  const actionButtons: Array<{
    action: PlatformCommunityAction;
    label: string;
    icon: typeof Archive;
    variant: "outline" | "ghost" | "destructive";
  }> = [];

  if (isArchived) {
    actionButtons.push({
      action: "restore",
      label: "Restore",
      icon: RefreshCcw,
      variant: "outline",
    });
  } else {
    actionButtons.push({
      action: "archive",
      label: "Archive",
      icon: Archive,
      variant: "outline",
    });
    actionButtons.push({
      action: isFeatured ? "unfeature" : "feature",
      label: isFeatured ? "Unfeature" : "Feature",
      icon: isFeatured ? StarOff : Sparkles,
      variant: "ghost",
    });
  }

  actionButtons.push({
    action: "delete",
    label: "Delete",
    icon: Trash2,
    variant: "destructive",
  });

  return (
    <div className="flex flex-wrap items-center gap-2">
      {actionButtons.map((item) => {
        const Icon = item.icon;
        const busy = loading === item.action;

        return (
          <Button
            key={item.action}
            type="button"
            size={compact ? "sm" : "default"}
            variant={item.variant}
            disabled={loading !== null}
            onClick={() => handleAction(item.action)}
          >
            {busy ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Icon className="mr-2 h-4 w-4" />
            )}
            {item.label}
          </Button>
        );
      })}
    </div>
  );
}

