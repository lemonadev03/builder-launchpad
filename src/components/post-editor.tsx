"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RichTextEditor } from "@/components/editor/rich-text-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TiptapContent } from "@/lib/tiptap";

interface Community {
  communityId: string;
  communitySlug: string;
  communityName: string;
}

interface PostEditorProps {
  communities: Community[];
  initialCommunitySlug?: string;
  post?: {
    id: string;
    title: string;
    slug: string;
    content: TiptapContent;
    status: string;
    communitySlug: string;
    communityId: string;
  };
}

export function PostEditor({
  communities,
  initialCommunitySlug,
  post,
}: PostEditorProps) {
  const router = useRouter();
  const isEditing = !!post;

  const [title, setTitle] = useState(post?.title ?? "");
  const [content, setContent] = useState<TiptapContent | null>(
    post?.content ?? null,
  );
  const [selectedCommunity, setSelectedCommunity] = useState(
    post?.communitySlug ??
      initialCommunitySlug ??
      communities[0]?.communitySlug ??
      "",
  );
  const [saving, setSaving] = useState(false);

  const community = communities.find(
    (c) => c.communitySlug === selectedCommunity,
  );

  async function handleSave(status: "draft" | "published") {
    if (!title.trim()) {
      toast.error("Title is required.");
      return;
    }
    if (!content) {
      toast.error("Content is required.");
      return;
    }
    if (!community) {
      toast.error("Select a community.");
      return;
    }

    setSaving(true);
    try {
      if (isEditing) {
        const res = await fetch(
          `/api/communities/${post.communitySlug}/posts/${post.slug}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, content, status }),
          },
        );
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || "Failed to save.");
          return;
        }
        toast.success(
          status === "published" ? "Post published!" : "Draft saved.",
        );
        if (status === "published") {
          router.push(
            `/communities/${post.communitySlug}/posts/${data.post.slug}`,
          );
        } else {
          router.refresh();
        }
      } else {
        const res = await fetch(
          `/api/communities/${selectedCommunity}/posts`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title,
              content,
              communityId: community.communityId,
              status,
            }),
          },
        );
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || "Failed to create post.");
          return;
        }
        toast.success(
          status === "published" ? "Post published!" : "Draft saved.",
        );
        if (status === "published") {
          router.push(
            `/communities/${selectedCommunity}/posts/${data.post.slug}`,
          );
        } else {
          router.push("/posts/drafts");
        }
      }
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  const uploadUrl = community
    ? `/api/communities/${community.communitySlug}/posts/upload`
    : "";

  return (
    <div className="space-y-6">
      {/* Community selector (only for new posts) */}
      {!isEditing && (
        <div className="space-y-2">
          <Label htmlFor="community">Community</Label>
          <select
            id="community"
            value={selectedCommunity}
            onChange={(e) => setSelectedCommunity(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {communities.map((c) => (
              <option key={c.communityId} value={c.communitySlug}>
                {c.communityName}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Post title"
          maxLength={200}
        />
      </div>

      {/* Editor */}
      {community && (
        <div className="space-y-2">
          <Label>Content</Label>
          <RichTextEditor
            content={content}
            onChange={setContent}
            uploadUrl={uploadUrl}
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          disabled={saving}
          onClick={() => handleSave("draft")}
        >
          {saving ? "Saving..." : "Save Draft"}
        </Button>
        <Button
          disabled={saving}
          onClick={() => handleSave("published")}
        >
          {saving ? "Publishing..." : "Publish"}
        </Button>
      </div>
    </div>
  );
}
