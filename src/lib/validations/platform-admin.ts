import { z } from "zod";

export const invitePlatformAdminSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
});

export type InvitePlatformAdminInput = z.infer<typeof invitePlatformAdminSchema>;
