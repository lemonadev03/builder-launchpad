import {
  and,
  eq,
  isNull,
  desc,
  count,
  ilike,
  sql,
} from "drizzle-orm";
import { db } from "@/db";
import { jobListing, company } from "@/db/schema";
import type { CreateJobInput, UpdateJobInput } from "@/lib/validations/job";

// ── Types ───────────────────────────────────────────────────────────

export type JobListingWithCompany = {
  id: string;
  title: string;
  description: string;
  requirements: string | null;
  location: string | null;
  remote: boolean;
  employmentType: string;
  salaryRange: string | null;
  applicationUrl: string;
  postedBy: string;
  createdAt: Date;
  updatedAt: Date;
  companyId: string;
  companyName: string;
  companyLogoUrl: string | null;
  companyWebsite: string | null;
  companyDescription: string | null;
};

// ── Mutations ───────────────────────────────────────────────────────

export async function createJob(
  userId: string,
  data: Omit<CreateJobInput, "companyId" | "company"> & { companyId: string },
) {
  const [created] = await db
    .insert(jobListing)
    .values({
      id: crypto.randomUUID(),
      title: data.title,
      companyId: data.companyId,
      description: data.description,
      requirements: data.requirements || null,
      location: data.location || null,
      remote: data.remote,
      employmentType: data.employmentType,
      salaryRange: data.salaryRange || null,
      applicationUrl: data.applicationUrl,
      postedBy: userId,
    })
    .returning();

  return created;
}

export async function updateJob(jobId: string, data: UpdateJobInput) {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === "") {
      cleaned[key] = null;
    } else if (value !== undefined) {
      cleaned[key] = value;
    }
  }

  const rows = await db
    .update(jobListing)
    .set(cleaned)
    .where(and(eq(jobListing.id, jobId), isNull(jobListing.archivedAt)))
    .returning();

  return rows[0] ?? null;
}

export async function archiveJob(jobId: string) {
  const rows = await db
    .update(jobListing)
    .set({ archivedAt: new Date() })
    .where(and(eq(jobListing.id, jobId), isNull(jobListing.archivedAt)))
    .returning();

  return rows[0] ?? null;
}

// ── Queries ─────────────────────────────────────────────────────────

export async function getJobById(jobId: string) {
  const rows = await db
    .select({
      id: jobListing.id,
      title: jobListing.title,
      description: jobListing.description,
      requirements: jobListing.requirements,
      location: jobListing.location,
      remote: jobListing.remote,
      employmentType: jobListing.employmentType,
      salaryRange: jobListing.salaryRange,
      applicationUrl: jobListing.applicationUrl,
      postedBy: jobListing.postedBy,
      createdAt: jobListing.createdAt,
      updatedAt: jobListing.updatedAt,
      companyId: company.id,
      companyName: company.name,
      companyLogoUrl: company.logoUrl,
      companyWebsite: company.website,
      companyDescription: company.description,
    })
    .from(jobListing)
    .innerJoin(company, eq(jobListing.companyId, company.id))
    .where(and(eq(jobListing.id, jobId), isNull(jobListing.archivedAt)))
    .limit(1);

  return (rows[0] as JobListingWithCompany) ?? null;
}

interface JobListOpts {
  limit: number;
  offset: number;
  search?: string;
  employmentType?: string;
  location?: string;
  remote?: boolean;
}

export async function getActiveJobs(opts: JobListOpts) {
  const conditions = [isNull(jobListing.archivedAt)];

  if (opts.search) {
    const term = `%${opts.search}%`;
    conditions.push(
      sql`(
        ${jobListing.title} ILIKE ${term}
        OR ${jobListing.description} ILIKE ${term}
        OR ${company.name} ILIKE ${term}
      )`,
    );
  }

  if (opts.employmentType) {
    conditions.push(
      eq(
        jobListing.employmentType,
        opts.employmentType as "full_time" | "part_time" | "freelance" | "internship",
      ),
    );
  }

  if (opts.location) {
    conditions.push(ilike(jobListing.location, `%${opts.location}%`));
  }

  if (opts.remote === true) {
    conditions.push(eq(jobListing.remote, true));
  }

  const where = and(...conditions);

  const rows = await db
    .select({
      id: jobListing.id,
      title: jobListing.title,
      description: jobListing.description,
      requirements: jobListing.requirements,
      location: jobListing.location,
      remote: jobListing.remote,
      employmentType: jobListing.employmentType,
      salaryRange: jobListing.salaryRange,
      applicationUrl: jobListing.applicationUrl,
      postedBy: jobListing.postedBy,
      createdAt: jobListing.createdAt,
      updatedAt: jobListing.updatedAt,
      companyId: company.id,
      companyName: company.name,
      companyLogoUrl: company.logoUrl,
      companyWebsite: company.website,
      companyDescription: company.description,
    })
    .from(jobListing)
    .innerJoin(company, eq(jobListing.companyId, company.id))
    .where(where)
    .orderBy(desc(jobListing.createdAt))
    .limit(opts.limit)
    .offset(opts.offset);

  const [totalRow] = await db
    .select({ count: count() })
    .from(jobListing)
    .innerJoin(company, eq(jobListing.companyId, company.id))
    .where(where);

  return {
    jobs: rows as JobListingWithCompany[],
    total: totalRow?.count ?? 0,
  };
}

export async function getActiveJobCountByUser(userId: string): Promise<number> {
  const [row] = await db
    .select({ count: count() })
    .from(jobListing)
    .where(
      and(eq(jobListing.postedBy, userId), isNull(jobListing.archivedAt)),
    );

  return row?.count ?? 0;
}

export async function getJobsByPoster(
  userId: string,
  opts: { limit: number; offset: number },
) {
  const where = and(
    eq(jobListing.postedBy, userId),
    isNull(jobListing.archivedAt),
  );

  const rows = await db
    .select({
      id: jobListing.id,
      title: jobListing.title,
      description: jobListing.description,
      requirements: jobListing.requirements,
      location: jobListing.location,
      remote: jobListing.remote,
      employmentType: jobListing.employmentType,
      salaryRange: jobListing.salaryRange,
      applicationUrl: jobListing.applicationUrl,
      postedBy: jobListing.postedBy,
      createdAt: jobListing.createdAt,
      updatedAt: jobListing.updatedAt,
      companyId: company.id,
      companyName: company.name,
      companyLogoUrl: company.logoUrl,
      companyWebsite: company.website,
      companyDescription: company.description,
    })
    .from(jobListing)
    .innerJoin(company, eq(jobListing.companyId, company.id))
    .where(where)
    .orderBy(desc(jobListing.createdAt))
    .limit(opts.limit)
    .offset(opts.offset);

  const [totalRow] = await db
    .select({ count: count() })
    .from(jobListing)
    .where(where);

  return {
    jobs: rows as JobListingWithCompany[],
    total: totalRow?.count ?? 0,
  };
}
