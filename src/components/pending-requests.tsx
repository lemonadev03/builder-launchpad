"use client";

import { useState } from "react";
import { Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface PendingRequest {
  id: string;
  userId: string;
  requestedAt: Date;
  displayName: string;
  username: string;
  avatarUrl: string | null;
}

interface PendingRequestsProps {
  requests: PendingRequest[];
  communitySlug: string;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function PendingRequests({
  requests: initialRequests,
  communitySlug,
}: PendingRequestsProps) {
  const [requests, setRequests] = useState(initialRequests);
  const [loading, setLoading] = useState<string | null>(null);

  async function handleAction(requestId: string, action: "approve" | "reject") {
    setLoading(requestId);
    try {
      const res = await fetch(
        `/api/communities/${communitySlug}/join-requests/${requestId}`,
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

      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      toast.success(action === "approve" ? "Request approved" : "Request rejected");
    } catch {
      toast.error(`Failed to ${action}`);
    } finally {
      setLoading(null);
    }
  }

  if (requests.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No pending join requests.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {requests.map((req) => {
        const isLoading = loading === req.id;

        return (
          <div
            key={req.id}
            className="flex items-center gap-3 rounded-lg border px-4 py-3"
          >
            <Avatar>
              {req.avatarUrl ? (
                <AvatarImage src={req.avatarUrl} alt={req.displayName} />
              ) : null}
              <AvatarFallback>{getInitials(req.displayName)}</AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{req.displayName}</p>
              <p className="truncate text-xs text-muted-foreground">
                @{req.username} &middot; Requested{" "}
                {new Date(req.requestedAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>

            <Button
              size="xs"
              onClick={() => handleAction(req.id, "approve")}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              Approve
            </Button>

            <Button
              variant="ghost"
              size="xs"
              onClick={() => handleAction(req.id, "reject")}
              disabled={isLoading}
              className="text-destructive hover:text-destructive"
            >
              <X className="h-3.5 w-3.5" />
              Reject
            </Button>
          </div>
        );
      })}
    </div>
  );
}
