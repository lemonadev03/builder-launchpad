"use client";

import { useState, useOptimistic, useTransition } from "react";
import { cn } from "@/lib/utils";

const REACTION_TYPES = [
  { type: "like", emoji: "\u{1F44D}", label: "Like" },
  { type: "love", emoji: "\u2764\uFE0F", label: "Love" },
  { type: "fire", emoji: "\u{1F525}", label: "Fire" },
  { type: "insightful", emoji: "\u{1F4A1}", label: "Insightful" },
] as const;

type ReactionType = (typeof REACTION_TYPES)[number]["type"];

interface ReactionBarProps {
  targetType: "post" | "comment";
  targetId: string;
  counts: Record<string, number>;
  userReactions: string[];
  compact?: boolean;
}

type OptimisticState = {
  counts: Record<string, number>;
  userReactions: string[];
};

export function ReactionBar({
  targetType,
  targetId,
  counts: initialCounts,
  userReactions: initialUserReactions,
  compact = false,
}: ReactionBarProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [optimistic, setOptimistic] = useOptimistic<
    OptimisticState,
    { type: ReactionType; action: "add" | "remove" }
  >(
    { counts: initialCounts, userReactions: initialUserReactions },
    (state, { type, action }) => {
      const newCounts = { ...state.counts };
      const newUserReactions = [...state.userReactions];

      if (action === "add") {
        newCounts[type] = (newCounts[type] ?? 0) + 1;
        if (!newUserReactions.includes(type)) newUserReactions.push(type);
      } else {
        newCounts[type] = Math.max(0, (newCounts[type] ?? 0) - 1);
        const idx = newUserReactions.indexOf(type);
        if (idx >= 0) newUserReactions.splice(idx, 1);
      }

      return { counts: newCounts, userReactions: newUserReactions };
    },
  );

  async function toggleReaction(type: ReactionType) {
    const isActive = optimistic.userReactions.includes(type);
    const action = isActive ? "remove" : "add";

    startTransition(async () => {
      setOptimistic({ type, action });
      setPickerOpen(false);

      await fetch("/api/reactions", {
        method: isActive ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetId, reactionType: type }),
      });
    });
  }

  const activeReactions = REACTION_TYPES.filter(
    (r) => (optimistic.counts[r.type] ?? 0) > 0,
  );

  return (
    <div className="flex items-center gap-1">
      {activeReactions.map((r) => {
        const isUserReaction = optimistic.userReactions.includes(r.type);
        const count = optimistic.counts[r.type] ?? 0;

        return (
          <button
            key={r.type}
            onClick={() => toggleReaction(r.type)}
            disabled={isPending}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors",
              isUserReaction
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-border bg-background text-muted-foreground hover:bg-muted",
            )}
            title={r.label}
          >
            <span className={compact ? "text-xs" : "text-sm"}>{r.emoji}</span>
            <span>{count}</span>
          </button>
        );
      })}

      <div className="relative">
        <button
          onClick={() => setPickerOpen(!pickerOpen)}
          className={cn(
            "inline-flex items-center rounded-full border border-dashed px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-muted",
            pickerOpen && "bg-muted",
          )}
        >
          +
        </button>

        {pickerOpen && (
          <div className="absolute bottom-full left-0 z-10 mb-1 flex gap-0.5 rounded-lg border bg-background p-1 shadow-md">
            {REACTION_TYPES.map((r) => (
              <button
                key={r.type}
                onClick={() => toggleReaction(r.type)}
                disabled={isPending}
                className={cn(
                  "rounded-md p-1.5 transition-colors hover:bg-muted",
                  optimistic.userReactions.includes(r.type) && "bg-primary/10",
                )}
                title={r.label}
              >
                <span className="text-base">{r.emoji}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {pickerOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}

/** Static display for post cards — no interactivity */
export function ReactionCountsDisplay({
  counts,
}: {
  counts: Record<string, number>;
}) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  if (total === 0) return null;

  const active = REACTION_TYPES.filter((r) => (counts[r.type] ?? 0) > 0);

  return (
    <span className="flex items-center gap-1 text-xs text-muted-foreground">
      {active.slice(0, 3).map((r) => (
        <span key={r.type}>{r.emoji}</span>
      ))}
      <span>{total}</span>
    </span>
  );
}
