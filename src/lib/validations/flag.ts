import { z } from "zod";

export const flagSchema = z.object({
  targetType: z.enum(["post", "comment"]),
  targetId: z.string().min(1),
  reason: z.enum(["spam", "harassment", "off_topic", "other"]),
  description: z.string().max(500).optional(),
});

export type FlagInput = z.infer<typeof flagSchema>;
