import { z } from "zod";

const tagColorSchema = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, "Color must be a valid hex code")
  .optional()
  .or(z.literal(""));

const tagLabelSchema = z
  .string()
  .trim()
  .min(1, "Label is required")
  .max(50)
  .refine((value) => /[a-z0-9]/i.test(value), {
    message: "Label must contain at least one letter or number",
  });

export const createPlatformTagSchema = z.object({
  label: tagLabelSchema,
  color: tagColorSchema,
});

export const updatePlatformTagSchema = z.object({
  label: tagLabelSchema,
  color: tagColorSchema,
});

export type CreatePlatformTagInput = z.infer<typeof createPlatformTagSchema>;
export type UpdatePlatformTagInput = z.infer<typeof updatePlatformTagSchema>;
