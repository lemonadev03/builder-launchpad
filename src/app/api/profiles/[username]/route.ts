import { NextResponse } from "next/server";
import { getProfileByUsername } from "@/lib/queries/profile";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;
  const p = await getProfileByUsername(username);

  if (!p) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  // Strip internal fields from public response
  const { userId, ...publicProfile } = p;
  void userId;

  return NextResponse.json({ profile: publicProfile });
}
