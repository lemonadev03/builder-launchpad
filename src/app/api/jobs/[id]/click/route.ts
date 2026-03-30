import { NextResponse } from "next/server";
import { incrementClickCount } from "@/lib/queries/job";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(
  _request: Request,
  context: RouteContext,
) {
  const { id } = await context.params;

  await incrementClickCount(id);

  return NextResponse.json({ ok: true });
}
