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

type ReactionState = {
  counts: Record<string, number>;
  userReactions: string[];
};

function applyToggle(
  state: ReactionState,
  type: ReactionType,
  action: "add" | "remove",
): ReactionState {
  const counts = { ...state.counts };
  const userReactions = [...state.userReactions];

  if (action === "add") {
    counts[type] = (counts[type] ?? 0) + 1;
    if (!userReactions.includes(type)) userReactions.push(type);
  } else {
    counts[type] = Math.max(0, (counts[type] ?? 0) - 1);
    const idx = userReactions.indexOf(type);
    if (idx >= 0) userReactions.splice(idx, 1);
  }

  return { counts, userReactions };
}

export function ReactionBar({
  targetType,
  targetId,
  counts: initialCounts,
  userReactions: initialUserReactions,
  compact = false,
}: ReactionBarProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [, startTransition] = useTransition();

  // Real client state — updated after API call succeeds
  const [confirmed, setConfirmed] = useState<ReactionState>({
    counts: initialCounts,
    userReactions: initialUserReactions,
  });

  // Optimistic layer on top of confirmed state
  const [optimistic, setOptimistic] = useOptimistic<
    ReactionState,
    { type: ReactionType; action: "add" | "remove" }
  >(confirmed, (state, { type, action }) => applyToggle(state, type, action));

  async function toggleReaction(type: ReactionType) {
    const isActive = optimistic.userReactions.includes(type);
    const action = isActive ? "remove" : "add";

    startTransition(async () => {
      setOptimistic({ type, action });
      setPickerOpen(false);

      const res = await fetch("/api/reactions", {
        method: isActive ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetId, reactionType: type }),
      });

      if (res.ok) {
        // Commit the change to real state
        setConfirmed((prev) => applyToggle(prev, type, action));
      }
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
