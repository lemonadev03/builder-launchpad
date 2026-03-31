"use client";

import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface CreateSubCommunityProps {
  parentId: string;
  tierLabel: string;
}

export function CreateSubCommunity({
  parentId,
  tierLabel,
}: CreateSubCommunityProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      const res = await fetch("/api/communities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          parentId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to create");
        return;
      }

      const { community } = await res.json();
      toast.success(`${tierLabel} created`);
      setName("");
      setDescription("");
      setOpen(false);
      router.push(`/communities/${community.slug}`);
    } catch {
      toast.error("Failed to create");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus className="mr-1.5 h-4 w-4" />
        Create {tierLabel}
      </Button>
    );
  }

  return (
    <form onSubmit={handleCreate} className="space-y-3 rounded-lg border p-4">
      <div className="space-y-1.5">
        <Label htmlFor="sub-name">Name</Label>
        <Input
          id="sub-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={`${tierLabel} name`}
          maxLength={100}
          autoFocus
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="sub-desc">Description</Label>
        <Textarea
          id="sub-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description"
          rows={2}
          maxLength={2000}
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={saving || !name.trim()}>
          {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
          Create
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setOpen(false)}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
