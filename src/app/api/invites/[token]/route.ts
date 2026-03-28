import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { redeemInvite } from "@/lib/queries/invite";

interface Props {
  params: Promise<{ token: string }>;
}

export async function POST(request: Request, { params }: Props) {
  const { token } = await params;
  const { session, response } = await requireApiAuth(request);
  if (response) return response;

  const result = await redeemInvite(token, session.user.id);

  if (result.error === "invalid") {
    return NextResponse.json(
      { error: "This invite link is invalid or has been revoked" },
      { status: 400 },
    );
  }

  if (result.error === "already_member") {
    return NextResponse.json({
      message: "Already a member",
      slug: result.slug,
    });
  }

  return NextResponse.json({
    message: "Joined successfully",
    slug: result.slug,
  });
}
