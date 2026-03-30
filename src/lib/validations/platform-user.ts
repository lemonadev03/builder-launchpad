import { z } from "zod";

export const platformUserActionSchema = z.object({
  action: z.enum(["warn", "suspend", "unsuspend"]),
  reason: z.string().max(500).optional(),
});
