import { NextRequest, NextResponse } from "next/server";
import { communitySlugSchema } from "@/lib/validations/community";
import { checkSlugAvailable, getCommunityBySlug } from "@/lib/queries/community";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function GET(request: NextRequest, { params }: Props) {
  const { slug: currentSlug } = await params;
  const candidateSlug = request.nextUrl.searchParams.get("slug");

  if (!candidateSlug) {
    return NextResponse.json(
      { error: "slug parameter required" },
      { status: 400 },
    );
  }

  const parsed = communitySlugSchema.safeParse(candidateSlug);
  if (!parsed.success) {
    return NextResponse.json(
      { available: false, error: parsed.error.issues[0]?.message },
      { status: 200 },
    );
  }

  // Get current community to exclude it from the uniqueness check
  const current = await getCommunityBySlug(currentSlug);
  const available = await checkSlugAvailable(
    parsed.data,
    current?.id,
  );

  return NextResponse.json({ available });
}
