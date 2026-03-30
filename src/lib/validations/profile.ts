import { z } from "zod";

export const SOCIAL_PLATFORMS = [
  "linkedin",
  "github",
  "twitter",
  "facebook",
  "discord",
  "website",
  "email",
] as const;

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

const urlOrEmpty = z
  .string()
  .trim()
  .refine((val) => val === "" || /^https?:\/\/.+/.test(val), {
    message: "Must be a valid URL starting with http:// or https://",
  })
  .optional();

const emailOrEmpty = z
  .string()
  .trim()
  .refine((val) => val === "" || z.string().email().safeParse(val).success, {
    message: "Must be a valid email address",
  })
  .optional();

export const usernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(30, "Username must be at most 30 characters")
  .regex(
    /^[a-z0-9][a-z0-9_]*[a-z0-9]$|^[a-z0-9]$/,
    "Lowercase letters, numbers, and underscores only. Cannot start or end with underscore.",
  );

export const displayNameSchema = z
  .string()
  .trim()
  .min(1, "Display name is required")
  .max(50, "Display name must be at most 50 characters");

export const bioSchema = z
  .string()
  .max(500, "Bio must be at most 500 characters")
  .optional()
  .or(z.literal(""));

export const taglineSchema = z
  .string()
  .max(100, "Tagline must be at most 100 characters")
  .optional()
  .or(z.literal(""));

export const socialLinksSchema = z
  .object({
    linkedin: urlOrEmpty,
    github: urlOrEmpty,
    twitter: urlOrEmpty,
    facebook: urlOrEmpty,
    discord: urlOrEmpty,
    website: urlOrEmpty,
    email: emailOrEmpty,
  })
  .optional();

export const locationSchema = z
  .string()
  .max(100, "Location must be at most 100 characters")
  .optional()
  .or(z.literal(""));

export const educationSchema = z
  .object({
    school: z
      .string()
      .max(100)
      .optional()
      .or(z.literal("")),
    program: z
      .string()
      .max(100)
      .optional()
      .or(z.literal("")),
    year: z
      .string()
      .max(10)
      .optional()
      .or(z.literal("")),
  })
  .optional();

export const tagSlugsSchema = z
  .array(z.string().max(50))
  .max(3, "Maximum 3 tags allowed");

export const updateProfileSchema = z.object({
  displayName: displayNameSchema.optional(),
  username: usernameSchema.optional(),
  bio: bioSchema,
  tagline: taglineSchema,
  location: locationSchema,
  educationSchool: z
    .string()
    .max(100)
    .optional()
    .or(z.literal("")),
  educationProgram: z
    .string()
    .max(100)
    .optional()
    .or(z.literal("")),
  educationYear: z
    .string()
    .max(10)
    .optional()
    .or(z.literal("")),
  socialLinks: socialLinksSchema,
  tags: tagSlugsSchema.optional(),
  onboardingCompletedAt: z.literal(true).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
