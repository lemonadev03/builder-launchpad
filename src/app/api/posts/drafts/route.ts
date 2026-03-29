import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { getDraftsByUser } from "@/lib/queries/post";

export async function GET(request: Request) {
  const { session, response } = await requireApiAuth(request);
  if (response) return response;

  const drafts = await getDraftsByUser(session.user.id);

  return NextResponse.json({ drafts });
}
