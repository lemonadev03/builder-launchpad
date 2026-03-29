import { z } from "zod";

export const createPostSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(200, "Title must be at most 200 characters"),
  content: z.record(z.string(), z.unknown()),
  tags: z
    .array(z.string().trim().min(1).max(30))
    .max(5, "Maximum 5 tags allowed")
    .default([])
    .transform((tags) => [...new Set(tags.map((t) => t.trim().toLowerCase()))]),
  communityId: z.string().min(1, "Community is required"),
  status: z.enum(["draft", "published"]).default("draft"),
});

export const updatePostSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(200, "Title must be at most 200 characters")
    .optional(),
  content: z.record(z.string(), z.unknown()).optional(),
  tags: z
    .array(z.string().trim().min(1).max(30))
    .max(5, "Maximum 5 tags allowed")
    .transform((tags) => [...new Set(tags.map((t) => t.trim().toLowerCase()))])
    .optional(),
  status: z.enum(["draft", "published"]).optional(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
