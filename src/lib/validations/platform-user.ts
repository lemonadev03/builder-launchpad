import { z } from "zod";

export const platformUserActionSchema = z.object({
  action: z.enum(["suspend", "unsuspend"]),
});
