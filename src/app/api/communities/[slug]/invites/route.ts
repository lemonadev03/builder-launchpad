import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { getCommunityBySlug } from "@/lib/queries/community";
import { requireCommunityPermission } from "@/lib/permissions";
import {
  createInvite,
  getInvitesByCommunity,
  getActiveInviteCount,
  revokeInvite,
} from "@/lib/queries/invite";

interface Props {
  params: Promise<{ slug: string }>;
}

const MAX_ACTIVE_INVITES = 20;

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
    "member.invite",
  );
  if (forbidden) return forbidden;

  const invites = await getInvitesByCommunity(c.id);
  return NextResponse.json({ invites });
}

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

  const forbidden = await requireCommunityPermission(
    session.user.id,
    c.id,
    "member.invite",
  );
  if (forbidden) return forbidden;

  // Anti-abuse: max active invite links per community
  const activeCount = await getActiveInviteCount(c.id);
  if (activeCount >= MAX_ACTIVE_INVITES) {
    return NextResponse.json(
      { error: `Maximum ${MAX_ACTIVE_INVITES} active invite links allowed` },
      { status: 400 },
    );
  }

  const inv = await createInvite(c.id, session.user.id);
  return NextResponse.json({ invite: inv }, { status: 201 });
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

  const forbidden = await requireCommunityPermission(
    session.user.id,
    c.id,
    "member.invite",
  );
  if (forbidden) return forbidden;

  let body: { inviteId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.inviteId) {
    return NextResponse.json(
      { error: "inviteId is required" },
      { status: 400 },
    );
  }

  const revoked = await revokeInvite(body.inviteId);
  if (!revoked) {
    return NextResponse.json(
      { error: "Invite not found or already revoked" },
      { status: 404 },
    );
  }

  return NextResponse.json({ invite: revoked });
}
