import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { checkCommunityCreateRateLimit } from "@/lib/rate-limit";
import { createCommunitySchema } from "@/lib/validations/community";
import { createCommunity, checkSlugAvailable } from "@/lib/queries/community";

export async function POST(request: Request) {
  const { session, response } = await requireApiAuth(request);
  if (response) return response;

  const rateCheck = checkCommunityCreateRateLimit(session.user.id);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: "Too many communities created. Please try again later." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createCommunitySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  if (parsed.data.slug) {
    const available = await checkSlugAvailable(parsed.data.slug);
    if (!available) {
      return NextResponse.json(
        { error: "Slug already taken" },
        { status: 409 },
      );
    }
  }

  try {
    const created = await createCommunity(session.user.id, parsed.data);
    return NextResponse.json({ community: created }, { status: 201 });
  } catch (err) {
    if (
      err instanceof Error &&
      err.message.includes("unique constraint")
    ) {
      return NextResponse.json(
        { error: "Slug already taken" },
        { status: 409 },
      );
    }
    throw err;
  }
}
