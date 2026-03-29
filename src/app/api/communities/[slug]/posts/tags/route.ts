import { NextResponse } from "next/server";
import { getCommunityBySlug } from "@/lib/queries/community";
import { getTagsByCommunity } from "@/lib/queries/post";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function GET(request: Request, { params }: Props) {
  const { slug } = await params;
  const c = await getCommunityBySlug(slug);
  if (!c || c.archivedAt) {
    return NextResponse.json(
      { error: "Community not found" },
      { status: 404 },
    );
  }

  const tags = await getTagsByCommunity(c.id);

  return NextResponse.json({ tags });
}
