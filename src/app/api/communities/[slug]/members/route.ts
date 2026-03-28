import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { membership } from "@/db/schema";
import { requireApiAuth } from "@/lib/api-auth";
import { getCommunityBySlug } from "@/lib/queries/community";
import { getMembersByCommunity } from "@/lib/queries/membership";
import { requireCommunityPermission } from "@/lib/permissions";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function GET(request: Request, { params }: Props) {
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

  const forbidden = await requireCommunityPermission(
    session.user.id,
    c.id,
    "community.manage_members",
  );
  if (forbidden) return forbidden;

  const members = await getMembersByCommunity(c.id);
  return NextResponse.json({ members });
}

// POST — self-join for open communities
export async function POST(request: Request, { params }: Props) {
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

  if (c.joinPolicy !== "open") {
    return NextResponse.json(
      { error: "This community does not allow open join" },
      { status: 400 },
    );
  }

  // Check if already a member
  const existing = await db
    .select({ id: membership.id })
    .from(membership)
    .where(
      and(
        eq(membership.userId, session.user.id),
        eq(membership.communityId, c.id),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    return NextResponse.json(
      { error: "Already a member" },
      { status: 409 },
    );
  }

  const [created] = await db
    .insert(membership)
    .values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      communityId: c.id,
      role: "member",
      status: "active",
    })
    .returning();

  return NextResponse.json({ membership: created }, { status: 201 });
}
