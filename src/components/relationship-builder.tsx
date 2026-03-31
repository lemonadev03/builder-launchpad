"use client";

import { useState, useEffect, useCallback, useReducer } from "react";
import { ChevronDown, ChevronRight, Link2, Users } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TreeNode } from "@/lib/queries/community-tree";
import type { PlatformSisterLink } from "@/lib/queries/sister";
import { RelationshipPanel } from "@/components/relationship-panel";

interface RelationshipBuilderProps {
  trees: TreeNode[];
  sisterLinks: PlatformSisterLink[];
}

// Flatten a tree into a list of { id, slug } for lookup
function flattenTree(node: TreeNode): TreeNode[] {
  return [node, ...node.children.flatMap(flattenTree)];
}

function findNode(trees: TreeNode[], id: string): TreeNode | null {
  for (const tree of trees) {
    for (const node of flattenTree(tree)) {
      if (node.id === id) return node;
    }
  }
  return null;
}

export function RelationshipBuilder({
  trees,
  sisterLinks,
}: RelationshipBuilderProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    // Auto-expand depth 0 and 1
    const ids = new Set<string>();
    for (const tree of trees) {
      for (const node of flattenTree(tree)) {
        if (node.depth < 2) ids.add(node.id);
      }
    }
    return ids;
  });
  const [canvasEl, setCanvasEl] = useState<HTMLDivElement | null>(null);
  // Increment to trigger SVG path recalculation after layout changes
  const [layoutTick, bumpLayout] = useReducer((n: number) => n + 1, 0);

  const selectedNode = selectedId ? findNode(trees, selectedId) : null;

  // Count sister links per community for badges
  const sisterCountMap = new Map<string, number>();
  for (const link of sisterLinks) {
    sisterCountMap.set(link.communityAId, (sisterCountMap.get(link.communityAId) ?? 0) + 1);
    sisterCountMap.set(link.communityBId, (sisterCountMap.get(link.communityBId) ?? 0) + 1);
  }

  const toggleExpand = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Observe container resizes
  useEffect(() => {
    if (!canvasEl) return;

    // Initial measurement after mount
    requestAnimationFrame(() => bumpLayout());

    const observer = new ResizeObserver(() => {
      requestAnimationFrame(() => bumpLayout());
    });
    observer.observe(canvasEl);
    return () => observer.disconnect();
  }, [canvasEl, expanded]);

  // ── Compute SVG paths from current DOM positions ─────────────────
  const paths = computePaths(canvasEl, sisterLinks, selectedId, layoutTick);

  return (
    <div className="flex h-[calc(100vh-theme(spacing.12)-theme(spacing.6))] gap-0">
      {/* Scroll container */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden pr-4">
        {/* Legend */}
        <div className="sticky top-0 z-10 mb-4 flex items-center gap-4 rounded-lg border bg-background/95 px-4 py-2 text-xs text-muted-foreground backdrop-blur-sm">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-5 rounded bg-primary" />
            Active sister link
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-5 rounded border-t-2 border-dashed border-amber-500" />
            Pending request
          </span>
          <span className="ml-auto">
            {trees.length} root{trees.length !== 1 ? "s" : ""} &middot;{" "}
            {sisterLinks.filter((l) => l.status === "active").length} sister
            links
          </span>
        </div>

        {/* Inner positioning context — SVG and tree scroll together */}
        <div ref={setCanvasEl} className="relative">
          {trees.length === 0 ? (
            <div className="py-20 text-center text-sm text-muted-foreground">
              No communities yet.
            </div>
          ) : (
            <div className="space-y-6 pb-8">
              {trees.map((tree) => (
                <div key={tree.id}>
                  <TreeNodeRow
                    node={tree}
                    selectedId={selectedId}
                    expanded={expanded}
                    sisterCountMap={sisterCountMap}
                    onSelect={setSelectedId}
                    onToggle={toggleExpand}
                    depth={0}
                  />
                </div>
              ))}
            </div>
          )}

          {/* SVG overlay for sister links — inside positioning context so it scrolls with content */}
          <svg className="pointer-events-none absolute inset-0 h-full w-full">
            {paths.map((p) => (
              <path
                key={p.key}
                d={p.d}
                fill="none"
                stroke={p.status === "active" ? "oklch(0.55 0.12 255)" : "oklch(0.65 0.12 80)"}
                strokeWidth={p.isSelected ? 2.5 : 1.5}
                strokeDasharray={p.status === "pending" ? "6 4" : undefined}
                opacity={p.isSelected ? 0.9 : 0.45}
                className="pointer-events-stroke transition-opacity"
              >
                <title>
                  {p.communityAName} ↔ {p.communityBName} ({p.status})
                </title>
              </path>
            ))}
          </svg>
        </div>
      </div>

      {/* Side panel */}
      <RelationshipPanel
        node={selectedNode}
        trees={trees}
        sisterLinks={sisterLinks}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}

// ── SVG path computation ───────────────────────────────────────────

type SvgPath = {
  key: string;
  d: string;
  status: string;
  isSelected: boolean;
  communityAName: string;
  communityBName: string;
};

function computePaths(
  container: HTMLDivElement | null,
  links: PlatformSisterLink[],
  selectedId: string | null,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- layoutTick forces recomputation
  _layoutTick: number
): SvgPath[] {
  if (!container) return [];

  const containerRect = container.getBoundingClientRect();
  const result: SvgPath[] = [];

  for (const link of links) {
    const elA = container.querySelector<HTMLElement>(
      `[data-community-id="${link.communityAId}"]`,
    );
    const elB = container.querySelector<HTMLElement>(
      `[data-community-id="${link.communityBId}"]`,
    );
    if (!elA || !elB) continue;

    const rectA = elA.getBoundingClientRect();
    const rectB = elB.getBoundingClientRect();

    const x1 = rectA.right - containerRect.left;
    const y1 = rectA.top + rectA.height / 2 - containerRect.top;
    const x2 = rectB.right - containerRect.left;
    const y2 = rectB.top + rectB.height / 2 - containerRect.top;

    const bulge = 60 + Math.abs(y2 - y1) * 0.15;
    const cx = Math.max(x1, x2) + bulge;
    const cy = (y1 + y2) / 2;

    const isSelected =
      link.communityAId === selectedId || link.communityBId === selectedId;

    result.push({
      key: link.linkId,
      d: `M ${x1} ${y1} Q ${cx} ${cy}, ${x2} ${y2}`,
      status: link.status,
      isSelected,
      communityAName: link.communityAName,
      communityBName: link.communityBName,
    });
  }

  return result;
}

// ── Tree node row ──────────────────────────────────────────────────

function TreeNodeRow({
  node,
  selectedId,
  expanded,
  sisterCountMap,
  onSelect,
  onToggle,
  depth,
}: {
  node: TreeNode;
  selectedId: string | null;
  expanded: Set<string>;
  sisterCountMap: Map<string, number>;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
  depth: number;
}) {
  const hasChildren = node.children.length > 0;
  const isExpanded = expanded.has(node.id);
  const isSelected = selectedId === node.id;
  const sisterCount = sisterCountMap.get(node.id) ?? 0;

  return (
    <div className={cn(depth > 0 && "ml-6 border-l border-border pl-4")}>
      <button
        type="button"
        data-community-id={node.id}
        onClick={() => {
          onSelect(node.id);
          if (hasChildren) onToggle(node.id);
        }}
        className={cn(
          "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-muted/50",
          isSelected && "bg-primary/10 ring-1 ring-primary/30",
          node.isArchived && "opacity-60",
        )}
      >
        {hasChildren ? (
          isExpanded ? (
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

        {sisterCount > 0 && (
          <Badge variant="ghost" className="gap-1 text-[10px] text-primary">
            <Link2 className="h-3 w-3" />
            {sisterCount}
          </Badge>
        )}
        <Badge variant="outline" className="text-xs">
          <Users className="mr-1 h-3 w-3" />
          {node.memberCount}
        </Badge>
        {node.isArchived && (
          <Badge variant="outline" className="text-[10px] text-amber-700">
            Archived
          </Badge>
        )}
      </button>

      {isExpanded && hasChildren && (
        <div className="mt-0.5">
          {node.children.map((child) => (
            <TreeNodeRow
              key={child.id}
              node={child}
              selectedId={selectedId}
              expanded={expanded}
              sisterCountMap={sisterCountMap}
              onSelect={onSelect}
              onToggle={onToggle}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
