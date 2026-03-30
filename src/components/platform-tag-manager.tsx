"use client";

import { useState } from "react";
import { Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PlatformTagRecord } from "@/lib/queries/platform-tag";

interface PlatformTagManagerProps {
  initialTags: PlatformTagRecord[];
}

type BusyState =
  | { type: "create" }
  | { type: "update"; tagId: string }
  | { type: "delete"; tagId: string }
  | null;

function TagPreview({
  label,
  color,
}: {
  label: string;
  color: string | null;
}) {
  return (
    <Badge
      variant="secondary"
      style={
        color
          ? {
              backgroundColor: `${color}15`,
              color,
              borderColor: `${color}30`,
            }
          : undefined
      }
    >
      {label}
    </Badge>
  );
}

export function PlatformTagManager({
  initialTags,
}: PlatformTagManagerProps) {
  const [tags, setTags] = useState(initialTags);
  const [newLabel, setNewLabel] = useState("");
  const [newColor, setNewColor] = useState("");
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState("");
  const [editingColor, setEditingColor] = useState("");
  const [busy, setBusy] = useState<BusyState>(null);

  async function handleCreate() {
    setBusy({ type: "create" });

    try {
      const response = await fetch("/api/platform/tags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          label: newLabel,
          color: newColor,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error(data?.error || "Failed to create tag");
        return;
      }

      setTags((current) =>
        [...current, data.tag].sort((a, b) => a.label.localeCompare(b.label)),
      );
      setNewLabel("");
      setNewColor("");
      toast.success(`Created ${data.tag.label}`);
    } catch {
      toast.error("Failed to create tag");
    } finally {
      setBusy(null);
    }
  }

  function startEditing(tag: PlatformTagRecord) {
    setEditingTagId(tag.id);
    setEditingLabel(tag.label);
    setEditingColor(tag.color ?? "");
  }

  function stopEditing() {
    setEditingTagId(null);
    setEditingLabel("");
    setEditingColor("");
  }

  async function handleUpdate(tagId: string) {
    setBusy({ type: "update", tagId });

    try {
      const response = await fetch(`/api/platform/tags/${tagId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          label: editingLabel,
          color: editingColor,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error(data?.error || "Failed to update tag");
        return;
      }

      setTags((current) =>
        current
          .map((tag) => (tag.id === tagId ? data.tag : tag))
          .sort((a, b) => a.label.localeCompare(b.label)),
      );
      stopEditing();
      toast.success(`Updated ${data.tag.label}`);
    } catch {
      toast.error("Failed to update tag");
    } finally {
      setBusy(null);
    }
  }

  async function handleDelete(tag: PlatformTagRecord) {
    const warning =
      tag.profilesCount > 0
        ? `Delete ${tag.label}? This will remove it from ${tag.profilesCount} profile${tag.profilesCount === 1 ? "" : "s"}.`
        : `Delete ${tag.label}?`;

    if (!window.confirm(warning)) return;

    setBusy({ type: "delete", tagId: tag.id });

    try {
      const response = await fetch(`/api/platform/tags/${tag.id}`, {
        method: "DELETE",
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error(data?.error || "Failed to delete tag");
        return;
      }

      setTags((current) => current.filter((item) => item.id !== tag.id));
      if (editingTagId === tag.id) {
        stopEditing();
      }
      toast.success(`Deleted ${tag.label}`);
    } catch {
      toast.error("Failed to delete tag");
    } finally {
      setBusy(null);
    }
  }

  const creating = busy?.type === "create";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tag catalog</CardTitle>
          <CardDescription>
            Manage the predefined profile tags members can select across the platform.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[minmax(0,1fr)_160px_auto] md:items-end">
          <div className="space-y-2">
            <Label htmlFor="new-tag-label">Tag label</Label>
            <Input
              id="new-tag-label"
              value={newLabel}
              onChange={(event) => setNewLabel(event.target.value)}
              placeholder="e.g. Cloud"
              maxLength={50}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-tag-color">Accent color</Label>
            <Input
              id="new-tag-color"
              value={newColor}
              onChange={(event) => setNewColor(event.target.value)}
              placeholder="#3b82f6"
              maxLength={7}
              className="font-mono"
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              disabled={creating || newLabel.trim().length === 0}
              onClick={handleCreate}
            >
              {creating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Add tag
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing tags</CardTitle>
          <CardDescription>
            Deleting a tag removes its `profile_tag` links through the existing database cascade.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          {tags.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              No tags found. Create the first platform tag above.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b text-xs uppercase tracking-[0.12em] text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Preview</th>
                    <th className="px-4 py-3 font-medium">Label</th>
                    <th className="px-4 py-3 font-medium">Slug</th>
                    <th className="px-4 py-3 font-medium">Profiles</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tags.map((tag) => {
                    const isEditing = editingTagId === tag.id;
                    const isUpdating =
                      busy?.type === "update" && busy.tagId === tag.id;
                    const isDeleting =
                      busy?.type === "delete" && busy.tagId === tag.id;

                    return (
                      <tr
                        key={tag.id}
                        className="border-b align-top last:border-b-0"
                      >
                        <td className="px-4 py-4">
                          <TagPreview label={tag.label} color={tag.color} />
                        </td>
                        <td className="px-4 py-4">
                          {isEditing ? (
                            <div className="grid min-w-[220px] gap-2">
                              <Input
                                value={editingLabel}
                                onChange={(event) =>
                                  setEditingLabel(event.target.value)
                                }
                                maxLength={50}
                              />
                              <Input
                                value={editingColor}
                                onChange={(event) =>
                                  setEditingColor(event.target.value)
                                }
                                placeholder="#3b82f6"
                                maxLength={7}
                                className="font-mono"
                              />
                            </div>
                          ) : (
                            <div className="min-w-[220px] font-medium">
                              {tag.label}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4 font-mono text-xs text-muted-foreground">
                          {tag.slug}
                        </td>
                        <td className="px-4 py-4">{tag.profilesCount}</td>
                        <td className="px-4 py-4">
                          <div className="flex justify-end gap-2">
                            {isEditing ? (
                              <>
                                <Button
                                  type="button"
                                  size="sm"
                                  disabled={busy !== null || editingLabel.trim().length === 0}
                                  onClick={() => handleUpdate(tag.id)}
                                >
                                  {isUpdating ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : null}
                                  Save
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  disabled={busy !== null}
                                  onClick={stopEditing}
                                >
                                  <X className="mr-2 h-4 w-4" />
                                  Cancel
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  disabled={busy !== null}
                                  onClick={() => startEditing(tag)}
                                >
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  disabled={busy !== null}
                                  onClick={() => handleDelete(tag)}
                                >
                                  {isDeleting ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="mr-2 h-4 w-4" />
                                  )}
                                  Delete
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
