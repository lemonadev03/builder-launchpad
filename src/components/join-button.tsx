"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface JoinButtonProps {
  joinPolicy: "invite_only" | "request_to_join" | "open";
  isMember: boolean;
}

export function JoinButton({ joinPolicy, isMember }: JoinButtonProps) {
  if (isMember) {
    return <Badge variant="secondary">Member</Badge>;
  }

  if (joinPolicy === "invite_only") {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        Invite Only
      </Badge>
    );
  }

  if (joinPolicy === "request_to_join") {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={() => toast.info("Join requests coming soon")}
      >
        Request to Join
      </Button>
    );
  }

  // Open
  return (
    <Button
      size="sm"
      onClick={() => toast.info("Open join coming soon")}
    >
      Join Community
    </Button>
  );
}
