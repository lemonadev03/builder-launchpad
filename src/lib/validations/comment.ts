import { z } from "zod";

export const createCommentSchema = z.object({
  content: z.record(z.string(), z.unknown()),
  parentCommentId: z.string().nullish(),
});

export const updateCommentSchema = z.object({
  content: z.record(z.string(), z.unknown()),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
