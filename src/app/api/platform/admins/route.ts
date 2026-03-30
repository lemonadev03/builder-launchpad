import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { grantOrInvitePlatformAdmin, isPlatformAdminUser } from "@/lib/platform-admin";
import { invitePlatformAdminSchema } from "@/lib/validations/platform-admin";

export async function POST(request: Request) {
  const { session, response } = await requireApiAuth(request);
  if (response) return response;

  const allowed = await isPlatformAdminUser(session.user.id);
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = invitePlatformAdminSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const baseUrl = process.env.BETTER_AUTH_URL || new URL(request.url).origin;
  const outcome = await grantOrInvitePlatformAdmin({
    email: parsed.data.email,
    invitedByUserId: session.user.id,
    invitedByName: session.user.name,
    baseUrl,
  });

  return NextResponse.json(outcome, { status: 200 });
}
