import { NextResponse } from "next/server";
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
