import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { getCommunityBySlug } from "@/lib/queries/community";
import { requireCommunityPermission } from "@/lib/permissions";
import {
  createJoinRequest,
  getPendingJoinRequests,
} from "@/lib/queries/join-request";

interface Props {
  params: Promise<{ slug: string }>;
}

// POST — submit a join request (any authenticated user)
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

  if (c.joinPolicy !== "request_to_join") {
    return NextResponse.json(
      { error: "This community does not accept join requests" },
      { status: 400 },
    );
  }

  const result = await createJoinRequest(session.user.id, c.id);

  if (result.error === "duplicate") {
    return NextResponse.json(
      { error: "You already have a pending request", status: result.status },
      { status: 409 },
    );
  }

  if (result.error === "already_member") {
    return NextResponse.json(
      { error: "You are already a member" },
      { status: 409 },
    );
  }

  return NextResponse.json({ request: result.request }, { status: 201 });
}

// GET — list pending requests (admin only)
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

  const requests = await getPendingJoinRequests(c.id);
  return NextResponse.json({ requests });
}
