"use client";

import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function PlatformCreateCommunity() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");

  function autoSlug(val: string) {
    return val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

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
          slug: slug || undefined,
          description: description.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to create community");
        return;
      }

      const { community } = await res.json();
      toast.success("Community created");
      setName("");
      setSlug("");
      setDescription("");
      setOpen(false);
      router.push(`/platform/communities/${community.id}`);
    } catch {
      toast.error("Failed to create community");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="mr-1.5 h-4 w-4" />
        Create community
      </Button>
    );
  }

  return (
    <form onSubmit={handleCreate} className="space-y-3 rounded-lg border p-4">
      <div className="space-y-1.5">
        <Label htmlFor="comm-name">Name</Label>
        <Input
          id="comm-name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (!slug || slug === autoSlug(name)) {
              setSlug(autoSlug(e.target.value));
            }
          }}
          placeholder="Community name"
          maxLength={100}
          autoFocus
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="comm-slug">Slug</Label>
        <Input
          id="comm-slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value.toLowerCase())}
          placeholder="community-slug"
          maxLength={60}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="comm-desc">Description</Label>
        <Textarea
          id="comm-desc"
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
