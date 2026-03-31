"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Users } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TreeNode } from "@/lib/queries/community-tree";

interface OrgChartProps {
  tree: TreeNode;
  currentSlug: string;
  isAdmin: boolean;
  /** Base path for node links, e.g. "/platform/communities". Defaults to "/communities". */
  hrefPrefix?: string;
  /** Which node field to use in the URL. Defaults to "slug". */
  hrefKey?: "slug" | "id";
}

export function OrgChart({
  tree,
  currentSlug,
  isAdmin,
  hrefPrefix = "/communities",
  hrefKey = "slug",
}: OrgChartProps) {
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const getViewHref = (node: TreeNode) =>
    `${hrefPrefix}/${hrefKey === "id" ? node.id : node.slug}`;
  const getManageHref = (node: TreeNode) =>
    isAdmin ? `${hrefPrefix}/${hrefKey === "id" ? node.id : node.slug}/manage` : null;

  return (
    <div className="flex gap-6 px-4 sm:px-6">
      {/* Tree */}
      <div className="min-w-0 flex-1 overflow-x-auto">
        <TreeNodeComponent
          node={tree}
          currentSlug={currentSlug}
          selectedId={selectedNode?.id ?? null}
          onSelect={setSelectedNode}
          depth={0}
        />
      </div>

      {/* Quick-view panel */}
      {selectedNode && (
        <div className="hidden w-72 shrink-0 rounded-lg border p-4 md:block">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                {selectedNode.logoUrl ? (
                  <AvatarImage
                    src={selectedNode.logoUrl}
                    alt={selectedNode.name}
                  />
                ) : null}
                <AvatarFallback className="text-sm">
                  {selectedNode.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {selectedNode.name}
                </p>
                {selectedNode.isArchived && (
                  <p className="text-xs text-amber-700">Archived</p>
                )}
                {selectedNode.subTierLabel && (
                  <p className="text-xs text-muted-foreground">
                    {selectedNode.children.length}{" "}
                    {selectedNode.subTierLabel.toLowerCase()}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>
                {selectedNode.memberCount} member
                {selectedNode.memberCount !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="space-y-2">
              <Link
                href={getViewHref(selectedNode)}
                className="block text-sm text-primary hover:underline"
              >
                View Community
              </Link>
              {getManageHref(selectedNode) && (
                <Link
                  href={getManageHref(selectedNode)!}
                  className="block text-sm text-muted-foreground hover:text-foreground"
                >
                  Manage
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TreeNodeComponent({
  node,
  currentSlug,
  selectedId,
  onSelect,
  depth,
}: {
  node: TreeNode;
  currentSlug: string;
  selectedId: string | null;
  onSelect: (node: TreeNode) => void;
  depth: number;
}) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = node.children.length > 0;
  const isSelected = selectedId === node.id;
  const isCurrent = node.slug === currentSlug;

  return (
    <div className={cn(depth > 0 && "ml-6 border-l border-border pl-4")}>
      <button
        type="button"
        onClick={() => {
          onSelect(node);
          if (hasChildren) setExpanded(!expanded);
        }}
        className={cn(
          "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-muted/50",
          isSelected && "bg-primary/10",
          isCurrent && "ring-1 ring-primary/30",
          node.isArchived && "opacity-70",
        )}
      >
        {hasChildren ? (
          expanded ? (
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          )
        ) : (
          <span className="w-4" />
        )}

        <Avatar className="h-6 w-6">
          {node.logoUrl ? (
            <AvatarImage src={node.logoUrl} alt={node.name} />
          ) : null}
          <AvatarFallback className="text-[10px]">
            {node.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <span className="min-w-0 flex-1 truncate text-sm font-medium">
          {node.name}
        </span>

        <Badge variant="outline" className="text-xs">
          {node.memberCount}
        </Badge>
        {node.isArchived && (
          <Badge variant="outline" className="text-[10px] text-amber-700">
            Archived
          </Badge>
        )}
      </button>

      {expanded && hasChildren && (
        <div className="mt-0.5">
          {node.children.map((child) => (
            <TreeNodeComponent
              key={child.id}
              node={child}
              currentSlug={currentSlug}
              selectedId={selectedId}
              onSelect={onSelect}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
