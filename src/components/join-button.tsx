"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface JoinButtonProps {
  joinPolicy: "invite_only" | "request_to_join" | "open";
  isMember: boolean;
  communitySlug: string;
  requestStatus: string | null; // null, "pending", "approved", "rejected"
  isAuthenticated: boolean;
}

export function JoinButton({
  joinPolicy,
  isMember,
  communitySlug,
  requestStatus,
  isAuthenticated,
}: JoinButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (isMember) {
    return <Badge variant="secondary">Member</Badge>;
  }

  if (!isAuthenticated) {
    if (joinPolicy === "invite_only") {
      return (
        <Badge variant="outline" className="text-muted-foreground">
          Invite Only
        </Badge>
      );
    }
    return (
      <Button
        size="sm"
        variant={joinPolicy === "open" ? "default" : "outline"}
        onClick={() => router.push(`/login?redirect=/communities/${communitySlug}`)}
      >
        {joinPolicy === "open" ? "Join Community" : "Request to Join"}
      </Button>
    );
  }

  if (joinPolicy === "invite_only") {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        Invite Only
      </Badge>
    );
  }

  if (joinPolicy === "request_to_join") {
    if (requestStatus === "pending") {
      return (
        <Badge variant="secondary" className="text-muted-foreground">
          Request Pending
        </Badge>
      );
    }

    if (requestStatus === "rejected") {
      return (
        <Badge variant="outline" className="text-muted-foreground">
          Request Declined
        </Badge>
      );
    }

    return (
      <Button
        size="sm"
        variant="outline"
        disabled={loading}
        onClick={async () => {
          setLoading(true);
          try {
            const res = await fetch(
              `/api/communities/${communitySlug}/join-requests`,
              { method: "POST" },
            );
            if (!res.ok) {
              const data = await res.json();
              toast.error(data.error || "Failed to submit request");
              return;
            }
            toast.success("Join request submitted");
            router.refresh();
          } catch {
            toast.error("Failed to submit request");
          } finally {
            setLoading(false);
          }
        }}
      >
        {loading && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
        Request to Join
      </Button>
    );
  }

  // Open
  return (
    <Button
      size="sm"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        try {
          const res = await fetch(
            `/api/communities/${communitySlug}/members`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({}),
            },
          );
          if (!res.ok) {
            const data = await res.json();
            toast.error(data.error || "Failed to join");
            return;
          }
          toast.success("Joined community!");
          router.refresh();
        } catch {
          toast.error("Failed to join");
        } finally {
          setLoading(false);
        }
      }}
    >
      {loading && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
      Join Community
    </Button>
  );
}
