"use client";

import { useState, useTransition } from "react";
import { Flag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const FLAG_REASONS = [
  { value: "spam", label: "Spam" },
  { value: "harassment", label: "Harassment" },
  { value: "off_topic", label: "Off-topic" },
  { value: "other", label: "Other" },
] as const;

interface FlagButtonProps {
  targetType: "post" | "comment";
  targetId: string;
  flagged?: boolean;
}

export function FlagButton({
  targetType,
  targetId,
  flagged: initialFlagged = false,
}: FlagButtonProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>("");
  const [description, setDescription] = useState("");
  const [flagged, setFlagged] = useState(initialFlagged);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    if (!reason) return;

    startTransition(async () => {
      const res = await fetch("/api/flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType,
          targetId,
          reason,
          description: description.trim() || undefined,
        }),
      });

      if (res.ok) {
        setFlagged(true);
        setOpen(false);
        setReason("");
        setDescription("");
        toast.success("Report submitted");
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Failed to submit report");
      }
    });
  }

  if (flagged) {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground"
        title="Reported"
      >
        <Flag className="h-3.5 w-3.5" />
      </span>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={cn(
          "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground",
        )}
        title="Report content"
      >
        <Flag className="h-3.5 w-3.5" />
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report {targetType === "post" ? "post" : "comment"}</DialogTitle>
          <DialogDescription>
            Why are you reporting this content?
          </DialogDescription>
        </DialogHeader>

        <RadioGroup value={reason} onValueChange={setReason}>
          {FLAG_REASONS.map((r) => (
            <div key={r.value} className="flex items-center gap-2">
              <RadioGroupItem value={r.value} id={`reason-${r.value}`} />
              <Label htmlFor={`reason-${r.value}`} className="cursor-pointer text-sm">
                {r.label}
              </Label>
            </div>
          ))}
        </RadioGroup>

        <Textarea
          placeholder="Additional details (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={500}
          rows={3}
          className="resize-none"
        />

        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={!reason || isPending}
            size="sm"
          >
            {isPending ? "Submitting..." : "Submit report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
