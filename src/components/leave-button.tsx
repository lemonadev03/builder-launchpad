"use client";

import { useState } from "react";
import { LogOut, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface LeaveButtonProps {
  communitySlug: string;
  userId: string;
}

export function LeaveButton({ communitySlug, userId }: LeaveButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLeave() {
    if (!confirm("Are you sure you want to leave this community?")) return;

    setLoading(true);
    try {
      const res = await fetch(
        `/api/communities/${communitySlug}/members/${userId}`,
        { method: "DELETE" },
      );

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to leave community");
        return;
      }

      toast.success("Left community");
      router.refresh();
    } catch {
      toast.error("Failed to leave community");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLeave}
      disabled={loading}
      className="text-muted-foreground hover:text-destructive"
    >
      {loading ? (
        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
      ) : (
        <LogOut className="mr-1.5 h-4 w-4" />
      )}
      Leave
    </Button>
  );
}
