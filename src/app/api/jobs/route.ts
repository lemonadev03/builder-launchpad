import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { createJobSchema } from "@/lib/validations/job";
import {
  createJob,
  getActiveJobs,
  getActiveJobCountByUser,
} from "@/lib/queries/job";
import {
  getCompanyByCreatedBy,
  createCompanyForPoster,
} from "@/lib/queries/company-profile";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

const MAX_ACTIVE_LISTINGS = 50;

export async function POST(request: Request) {
  const { session, response } = await requireApiAuth(request);
  if (response) return response;

  // Check company_poster permission
  const [dbUser] = await db
    .select({ isCompanyPoster: user.isCompanyPoster })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);

  if (!dbUser?.isCompanyPoster) {
    return NextResponse.json(
      { error: "Only approved company posters can create job listings" },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createJobSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  // Resolve company: use existing, or auto-create from inline fields
  let companyId = parsed.data.companyId;

  if (!companyId) {
    // Check if poster already has a company
    const existing = await getCompanyByCreatedBy(session.user.id);

    if (existing) {
      companyId = existing.id;
    } else if (parsed.data.company) {
      // First listing — create company inline
      const created = await createCompanyForPoster(
        session.user.id,
        parsed.data.company,
      );
      companyId = created.id;
    } else {
      return NextResponse.json(
        { error: "Company info required for first listing. Provide companyId or company object." },
        { status: 400 },
      );
    }
  }

  // Anti-abuse: max active listings
  const activeCount = await getActiveJobCountByUser(session.user.id);
  if (activeCount >= MAX_ACTIVE_LISTINGS) {
    return NextResponse.json(
      { error: `Maximum ${MAX_ACTIVE_LISTINGS} active listings allowed` },
      { status: 429 },
    );
  }

  const created = await createJob(session.user.id, {
    ...parsed.data,
    companyId,
  });

  return NextResponse.json({ job: created }, { status: 201 });
}

export async function GET(request: Request) {
  const url = new URL(request.url);

  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(
    50,
    Math.max(1, parseInt(url.searchParams.get("limit") ?? "20", 10) || 20),
  );
  const offset = (page - 1) * limit;

  const search = url.searchParams.get("q") || undefined;
  const employmentType = url.searchParams.get("type") || undefined;
  const location = url.searchParams.get("location") || undefined;
  const remoteParam = url.searchParams.get("remote");
  const remote = remoteParam === "true" ? true : undefined;

  const { jobs, total } = await getActiveJobs({
    limit,
    offset,
    search,
    employmentType,
    location,
    remote,
  });

  return NextResponse.json({ jobs, total, page, limit });
}
