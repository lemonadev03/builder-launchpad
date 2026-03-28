import { NextResponse } from "next/server";
import { getInviteByToken } from "@/lib/queries/invite";
import { checkInviteInfoRateLimit } from "@/lib/rate-limit";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { community } from "@/db/schema";

interface Props {
  params: Promise<{ token: string }>;
}

export async function GET(request: Request, { params }: Props) {
  const { token } = await params;

  // Rate limit by IP to prevent token enumeration
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rateCheck = checkInviteInfoRateLimit(ip);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 },
    );
  }

  const inv = await getInviteByToken(token);
  if (!inv || inv.revokedAt) {
    return NextResponse.json(
      { error: "Invalid invite" },
      { status: 404 },
    );
  }

  const [comm] = await db
    .select({
      name: community.name,
      logoUrl: community.logoUrl,
      slug: community.slug,
    })
    .from(community)
    .where(eq(community.id, inv.communityId))
    .limit(1);

  if (!comm) {
    return NextResponse.json(
      { error: "Community not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    communityName: comm.name,
    communityLogoUrl: comm.logoUrl,
    communitySlug: comm.slug,
  });
}
