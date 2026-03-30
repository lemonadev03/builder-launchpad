import { z } from "zod";

export const createSisterRequestSchema = z.object({
  targetCommunityId: z.string().min(1, "Target community is required"),
});

export const respondSisterRequestSchema = z.object({
  action: z.enum(["accept", "decline"]),
});

export type CreateSisterRequestInput = z.infer<typeof createSisterRequestSchema>;
export type RespondSisterRequestInput = z.infer<typeof respondSisterRequestSchema>;
