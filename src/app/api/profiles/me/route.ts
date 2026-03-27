import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { checkProfileUpdateRateLimit } from "@/lib/rate-limit";
import { updateProfileSchema } from "@/lib/validations/profile";
import {
  getProfileByUserId,
  updateProfile,
  checkUsernameAvailable,
} from "@/lib/queries/profile";

export async function GET(request: Request) {
  const { session, response } = await requireApiAuth(request);
  if (response) return response;

  const p = await getProfileByUserId(session.user.id);
  if (!p) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json({ profile: p });
}

export async function PUT(request: Request) {
  const { session, response } = await requireApiAuth(request);
  if (response) return response;

  const rateCheck = checkProfileUpdateRateLimit(session.user.id);
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

  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  // Username uniqueness check
  if (parsed.data.username) {
    const available = await checkUsernameAvailable(
      parsed.data.username,
      session.user.id,
    );
    if (!available) {
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 409 },
      );
    }
  }

  const updated = await updateProfile(session.user.id, parsed.data);
  if (!updated) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json({ profile: updated });
}
