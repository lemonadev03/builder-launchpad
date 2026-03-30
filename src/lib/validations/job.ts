import { z } from "zod";

export const createJobSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(200, "Title must be at most 200 characters"),
  companyId: z.string().min(1, "Company is required"),
  description: z
    .string()
    .trim()
    .min(1, "Description is required")
    .max(10000, "Description must be at most 10,000 characters"),
  requirements: z
    .string()
    .trim()
    .max(5000, "Requirements must be at most 5,000 characters")
    .optional(),
  location: z
    .string()
    .trim()
    .max(200, "Location must be at most 200 characters")
    .optional(),
  remote: z.boolean().default(false),
  employmentType: z.enum([
    "full_time",
    "part_time",
    "freelance",
    "internship",
  ]),
  salaryRange: z
    .string()
    .trim()
    .max(100, "Salary range must be at most 100 characters")
    .optional(),
  applicationUrl: z
    .string()
    .trim()
    .url("Application URL must be a valid URL")
    .max(500, "URL must be at most 500 characters"),
});

export const updateJobSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(200, "Title must be at most 200 characters")
    .optional(),
  description: z
    .string()
    .trim()
    .min(1, "Description is required")
    .max(10000, "Description must be at most 10,000 characters")
    .optional(),
  requirements: z
    .string()
    .trim()
    .max(5000, "Requirements must be at most 5,000 characters")
    .optional(),
  location: z
    .string()
    .trim()
    .max(200, "Location must be at most 200 characters")
    .optional(),
  remote: z.boolean().optional(),
  employmentType: z
    .enum(["full_time", "part_time", "freelance", "internship"])
    .optional(),
  salaryRange: z
    .string()
    .trim()
    .max(100, "Salary range must be at most 100 characters")
    .optional(),
  applicationUrl: z
    .string()
    .trim()
    .url("Application URL must be a valid URL")
    .max(500, "URL must be at most 500 characters")
    .optional(),
});

export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;
