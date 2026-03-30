import { z } from "zod";

export const reactionSchema = z.object({
  targetType: z.enum(["post", "comment"]),
  targetId: z.string().min(1),
  reactionType: z.enum(["like", "love", "fire", "insightful"]),
});

export const bookmarkSchema = z.object({
  targetType: z.enum(["post", "listing"]),
  targetId: z.string().min(1),
});

export type ReactionInput = z.infer<typeof reactionSchema>;
export type BookmarkInput = z.infer<typeof bookmarkSchema>;
