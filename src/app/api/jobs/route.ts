import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { createJobSchema } from "@/lib/validations/job";
import {
  createJob,
  getActiveJobs,
  getActiveJobCountByUser,
} from "@/lib/queries/job";
import { db } from "@/db";
import { user, company } from "@/db/schema";
import { eq, and } from "drizzle-orm";

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

  // Verify the company belongs to this user
  const [comp] = await db
    .select({ id: company.id })
    .from(company)
    .where(
      and(
        eq(company.id, parsed.data.companyId),
        eq(company.createdBy, session.user.id),
      ),
    )
    .limit(1);

  if (!comp) {
    return NextResponse.json(
      { error: "Company not found or does not belong to you" },
      { status: 404 },
    );
  }

  // Anti-abuse: max active listings
  const activeCount = await getActiveJobCountByUser(session.user.id);
  if (activeCount >= MAX_ACTIVE_LISTINGS) {
    return NextResponse.json(
      { error: `Maximum ${MAX_ACTIVE_LISTINGS} active listings allowed` },
      { status: 429 },
    );
  }

  const created = await createJob(session.user.id, parsed.data);

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
