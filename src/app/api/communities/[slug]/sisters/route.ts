import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { hasPermission } from "@/lib/permissions";
import { getCommunityBySlug } from "@/lib/queries/community";
import {
  getAllSisterLinks,
  getDirectSisterLinkCount,
  checkDuplicateSisterLink,
  createSisterRequest,
} from "@/lib/queries/sister";
import { createSisterRequestSchema } from "@/lib/validations/sister";
import { db } from "@/db";
import { community } from "@/db/schema";
import { eq } from "drizzle-orm";

const MAX_DIRECT_SISTERS = 20;

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  const { slug } = await context.params;

  const comm = await getCommunityBySlug(slug);
  if (!comm) {
    return NextResponse.json({ error: "Community not found" }, { status: 404 });
  }

  const sisters = await getAllSisterLinks(comm.id);

  return NextResponse.json({ sisters });
}

export async function POST(
  request: Request,
  context: RouteContext,
) {
  const { session, response } = await requireApiAuth(request);
  if (response) return response;

  const { slug } = await context.params;

  const comm = await getCommunityBySlug(slug);
  if (!comm) {
    return NextResponse.json({ error: "Community not found" }, { status: 404 });
  }

  // Admin only
  const isAdmin = await hasPermission(session.user.id, comm.id, "community.edit");
  if (!isAdmin) {
    return NextResponse.json(
      { error: "Only admins can send sister requests" },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createSisterRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { targetCommunityId } = parsed.data;

  // Can't sister with yourself
  if (targetCommunityId === comm.id) {
    return NextResponse.json(
      { error: "Cannot create a sister link with yourself" },
      { status: 400 },
    );
  }

  // Verify target exists
  const [target] = await db
    .select({ id: community.id })
    .from(community)
    .where(eq(community.id, targetCommunityId))
    .limit(1);

  if (!target) {
    return NextResponse.json(
      { error: "Target community not found" },
      { status: 404 },
    );
  }

  // Anti-abuse: max direct sisters
  const directCount = await getDirectSisterLinkCount(comm.id);
  if (directCount >= MAX_DIRECT_SISTERS) {
    return NextResponse.json(
      { error: `Maximum ${MAX_DIRECT_SISTERS} direct sister links allowed` },
      { status: 429 },
    );
  }

  // Check for duplicate (including ancestor inheritance)
  const duplicate = await checkDuplicateSisterLink(comm.id, targetCommunityId);
  if (duplicate.exists) {
    return NextResponse.json(
      { error: duplicate.reason },
      { status: 409 },
    );
  }

  const created = await createSisterRequest(
    comm.id,
    targetCommunityId,
    session.user.id,
  );

  if (!created) {
    return NextResponse.json(
      { error: "Sister link request already exists" },
      { status: 409 },
    );
  }

  return NextResponse.json({ sisterLink: created }, { status: 201 });
}
