import { z } from "zod";

const RESERVED_SLUGS = [
  "manage",
  "settings",
  "new",
  "create",
  "api",
  "admin",
  "platform",
  "members",
  "moderation",
];

export const communityNameSchema = z
  .string()
  .trim()
  .min(2, "Name must be at least 2 characters")
  .max(100, "Name must be at most 100 characters");

export const communitySlugSchema = z
  .string()
  .min(2, "Slug must be at least 2 characters")
  .max(60, "Slug must be at most 60 characters")
  .regex(
    /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/,
    "Lowercase letters, numbers, and hyphens only. Cannot start or end with a hyphen.",
  )
  .refine((s) => !RESERVED_SLUGS.includes(s), "This slug is reserved");

export const communityDescriptionSchema = z
  .string()
  .max(2000, "Description must be at most 2000 characters")
  .optional()
  .or(z.literal(""));

export const communityTaglineSchema = z
  .string()
  .max(150, "Tagline must be at most 150 characters")
  .optional()
  .or(z.literal(""));

export const primaryColorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color (e.g. #1a2b3c)")
  .optional()
  .or(z.literal(""));

export const visibilitySchema = z.enum(["listed", "unlisted"]);

export const joinPolicySchema = z.enum([
  "invite_only",
  "request_to_join",
  "open",
]);

export const createCommunitySchema = z.object({
  name: communityNameSchema,
  slug: communitySlugSchema.optional(),
  description: communityDescriptionSchema,
  tagline: communityTaglineSchema,
  location: z
    .string()
    .max(100, "Location must be at most 100 characters")
    .optional()
    .or(z.literal("")),
  parentId: z.string().optional(),
});

export type CreateCommunityInput = z.infer<typeof createCommunitySchema>;

export const subTierLabelSchema = z
  .string()
  .max(30, "Sub-tier name must be at most 30 characters")
  .optional()
  .or(z.literal(""));

export const updateCommunitySchema = z.object({
  name: communityNameSchema.optional(),
  slug: communitySlugSchema.optional(),
  description: communityDescriptionSchema,
  tagline: communityTaglineSchema,
  location: z
    .string()
    .max(100, "Location must be at most 100 characters")
    .optional()
    .or(z.literal("")),
  primaryColor: primaryColorSchema,
  visibility: visibilitySchema.optional(),
  joinPolicy: joinPolicySchema.optional(),
  subTierLabel: subTierLabelSchema,
});

export type UpdateCommunityInput = z.infer<typeof updateCommunitySchema>;
