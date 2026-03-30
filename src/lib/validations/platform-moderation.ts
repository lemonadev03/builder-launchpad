import { z } from "zod";

export const platformModerationActionSchema = z.object({
  action: z.enum(["hide", "delete", "dismiss_flags"]),
  targetType: z.enum(["post", "comment"]),
  targetId: z.string().min(1),
  reason: z.string().max(500).optional(),
});
