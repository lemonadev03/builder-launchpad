"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PlatformAdminInviteForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return;

    setSubmitting(true);

    try {
      const response = await fetch("/api/platform/admins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: normalizedEmail }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        toast.error(data?.error || "Failed to grant platform access");
        return;
      }

      if (data?.result?.kind === "already_admin") {
        toast.success(`${normalizedEmail} already has platform access`);
      } else if (data?.result?.kind === "granted") {
        toast.success(`Platform access granted to ${normalizedEmail}`);
      } else {
        toast.success(`Invitation queued for ${normalizedEmail}`);
      }

      if (data?.emailSent === false) {
        toast.warning("Access updated, but the email could not be delivered.");
      }

      setEmail("");
      router.refresh();
    } catch {
      toast.error("Failed to grant platform access");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="platform-admin-email">Invite platform admin</Label>
        <Input
          id="platform-admin-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="captain@example.com"
          autoComplete="email"
        />
      </div>
      <Button type="submit" size="sm" disabled={submitting || !email.trim()}>
        {submitting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Send className="mr-2 h-4 w-4" />
        )}
        Grant access
      </Button>
      <p className="text-xs text-muted-foreground">
        Existing users are promoted immediately. New emails are allowlisted and
        activated automatically after signup.
      </p>
    </form>
  );
}
