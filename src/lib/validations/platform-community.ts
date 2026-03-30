import { z } from "zod";

export const platformCommunityActionSchema = z.object({
  action: z.enum(["archive", "restore", "feature", "unfeature"]),
});

