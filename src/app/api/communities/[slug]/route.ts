import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { requireApiAuth } from "@/lib/api-auth";
import { auth } from "@/lib/auth";
import { checkCommunityUpdateRateLimit } from "@/lib/rate-limit";
import { updateCommunitySchema } from "@/lib/validations/community";
import {
  getCommunityBySlug,
  updateCommunity,
  archiveCommunity,
  checkSlugAvailable,
} from "@/lib/queries/community";
import { db } from "@/db";
import { membership } from "@/db/schema";

interface Props {
  params: Promise<{ slug: string }>;
}

function isAdmin(role: string) {
  return role === "admin";
}

async function getUserMembership(userId: string, communityId: string) {
  const rows = await db
    .select({ role: membership.role, status: membership.status })
    .from(membership)
    .where(
      and(
        eq(membership.userId, userId),
        eq(membership.communityId, communityId),
        eq(membership.status, "active"),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}

export async function GET(request: Request, { params }: Props) {
  const { slug } = await params;
  const c = await getCommunityBySlug(slug);

  if (!c) {
    return NextResponse.json(
      { error: "Community not found" },
      { status: 404 },
    );
  }

  // Unlisted communities: only visible to members
  if (c.visibility === "unlisted") {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json(
        { error: "Community not found" },
        { status: 404 },
      );
    }

    const mem = await getUserMembership(session.user.id, c.id);
    if (!mem) {
      return NextResponse.json(
        { error: "Community not found" },
        { status: 404 },
      );
    }
  }

  return NextResponse.json({ community: c });
}

export async function PUT(request: Request, { params }: Props) {
  const { slug } = await params;
  const { session, response } = await requireApiAuth(request);
  if (response) return response;

  const c = await getCommunityBySlug(slug);
  if (!c) {
    return NextResponse.json(
      { error: "Community not found" },
      { status: 404 },
    );
  }

  const mem = await getUserMembership(session.user.id, c.id);
  if (!mem || !isAdmin(mem.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rateCheck = checkCommunityUpdateRateLimit(session.user.id);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: "Too many updates. Please try again later." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateCommunitySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  if (parsed.data.slug) {
    const available = await checkSlugAvailable(parsed.data.slug, c.id);
    if (!available) {
      return NextResponse.json(
        { error: "Slug already taken" },
        { status: 409 },
      );
    }
  }

  const updated = await updateCommunity(c.id, parsed.data);
  if (!updated) {
    return NextResponse.json(
      { error: "Community not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({ community: updated });
}

export async function DELETE(request: Request, { params }: Props) {
  const { slug } = await params;
  const { session, response } = await requireApiAuth(request);
  if (response) return response;

  const c = await getCommunityBySlug(slug);
  if (!c) {
    return NextResponse.json(
      { error: "Community not found" },
      { status: 404 },
    );
  }

  const mem = await getUserMembership(session.user.id, c.id);
  if (!mem || !isAdmin(mem.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const archived = await archiveCommunity(c.id);
  if (!archived) {
    return NextResponse.json(
      { error: "Community not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({ community: archived });
}
