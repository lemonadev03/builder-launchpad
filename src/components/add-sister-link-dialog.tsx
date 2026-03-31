"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Link2, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useDebounce } from "@/hooks/use-debounce";
import type { TreeNode } from "@/lib/queries/community-tree";
import type { PlatformSisterLink } from "@/lib/queries/sister";

interface AddSisterLinkDialogProps {
  node: TreeNode;
  trees: TreeNode[];
  existingLinks: PlatformSisterLink[];
}

function flattenTree(node: TreeNode): TreeNode[] {
  return [node, ...node.children.flatMap(flattenTree)];
}

export function AddSisterLinkDialog({
  node,
  trees,
  existingLinks,
}: AddSisterLinkDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [sending, setSending] = useState<string | null>(null);
  const debouncedSearch = useDebounce(search, 200);

  // Flatten all trees into a searchable list
  const allCommunities = useMemo(
    () => trees.flatMap(flattenTree),
    [trees],
  );

  // IDs that can't be linked (self, already linked) — ancestor dedup is handled server-side
  const excludedIds = useMemo(() => {
    const ids = new Set<string>();
    ids.add(node.id);
    for (const link of existingLinks) {
      ids.add(link.communityAId);
      ids.add(link.communityBId);
    }
    return ids;
  }, [node.id, existingLinks]);

  const filtered = useMemo(() => {
    const term = debouncedSearch.toLowerCase().trim();
    return allCommunities
      .filter((c) => !excludedIds.has(c.id) && !c.isArchived)
      .filter((c) => !term || c.name.toLowerCase().includes(term))
      .slice(0, 20);
  }, [allCommunities, excludedIds, debouncedSearch]);

  async function handleSend(targetId: string) {
    setSending(targetId);
    try {
      const res = await fetch(`/api/communities/${node.slug}/sisters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetCommunityId: targetId }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to send request");
        return;
      }
      toast.success("Sister link request sent");
      setOpen(false);
      setSearch("");
      router.refresh();
    } catch {
      toast.error("Failed to send request");
    } finally {
      setSending(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
            <Link2 className="h-3 w-3" />
            Add
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Sister Link</DialogTitle>
          <DialogDescription>
            Send a sister link request from {node.name} to another community.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search communities..."
            className="pl-9"
            autoFocus
          />
        </div>

        <div className="max-h-64 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {debouncedSearch
                ? "No matching communities found."
                : "No available communities to link."}
            </p>
          ) : (
            <div className="space-y-1">
              {filtered.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  disabled={sending !== null}
                  onClick={() => handleSend(c.id)}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-muted/50 disabled:opacity-50"
                >
                  <Avatar className="h-7 w-7">
                    {c.logoUrl ? (
                      <AvatarImage src={c.logoUrl} alt={c.name} />
                    ) : null}
                    <AvatarFallback className="text-[10px]">
                      {c.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Depth {c.depth} &middot; {c.memberCount} members
                    </p>
                  </div>
                  {sending === c.id ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : (
                    <Badge variant="ghost" className="text-[10px] text-primary">
                      Request
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
