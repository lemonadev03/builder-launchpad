import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { updateJobSchema } from "@/lib/validations/job";
import { getJobById, updateJob, archiveJob } from "@/lib/queries/job";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  const { id } = await context.params;

  const job = await getJobById(id);
  if (!job) {
    return NextResponse.json({ error: "Job listing not found" }, { status: 404 });
  }

  return NextResponse.json({ job });
}

export async function PUT(
  request: Request,
  context: RouteContext,
) {
  const { session, response } = await requireApiAuth(request);
  if (response) return response;

  const { id } = await context.params;

  const job = await getJobById(id);
  if (!job) {
    return NextResponse.json({ error: "Job listing not found" }, { status: 404 });
  }

  if (job.postedBy !== session.user.id) {
    return NextResponse.json(
      { error: "Only the poster can edit this listing" },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateJobSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const updated = await updateJob(id, parsed.data);

  return NextResponse.json({ job: updated });
}

export async function DELETE(
  request: Request,
  context: RouteContext,
) {
  const { session, response } = await requireApiAuth(request);
  if (response) return response;

  const { id } = await context.params;

  const job = await getJobById(id);
  if (!job) {
    return NextResponse.json({ error: "Job listing not found" }, { status: 404 });
  }

  // Poster or platform admin can delete
  const isPoster = job.postedBy === session.user.id;

  if (!isPoster) {
    const [dbUser] = await db
      .select({ isPlatformAdmin: user.isPlatformAdmin })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    if (!dbUser?.isPlatformAdmin) {
      return NextResponse.json(
        { error: "Only the poster or platform admin can delete this listing" },
        { status: 403 },
      );
    }
  }

  await archiveJob(id);

  return NextResponse.json({ deleted: true });
}
