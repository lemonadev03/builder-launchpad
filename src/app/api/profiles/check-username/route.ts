import { NextRequest, NextResponse } from "next/server";
import { usernameSchema } from "@/lib/validations/profile";
import { checkUsernameAvailable } from "@/lib/queries/profile";

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get("username");

  if (!username) {
    return NextResponse.json(
      { error: "username parameter required" },
      { status: 400 },
    );
  }

  const parsed = usernameSchema.safeParse(username);
  if (!parsed.success) {
    return NextResponse.json(
      { available: false, error: parsed.error.issues[0]?.message },
      { status: 200 },
    );
  }

  const available = await checkUsernameAvailable(parsed.data);

  return NextResponse.json({ available });
}
