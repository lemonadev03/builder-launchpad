import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { isPlatformAdminUser } from "@/lib/platform-admin";
import {
  createPlatformTag,
  listPlatformTags,
} from "@/lib/queries/platform-tag";
import { createPlatformTagSchema } from "@/lib/validations/platform-tag";

export async function GET(request: Request) {
  const { session, response } = await requireApiAuth(request);
  if (response) return response;

  const allowed = await isPlatformAdminUser(session.user.id);
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const tags = await listPlatformTags();
  return NextResponse.json({ tags });
}

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

  const parsed = createPlatformTagSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const result = await createPlatformTag(parsed.data);
  if (result.kind === "duplicate") {
    return NextResponse.json(
      { error: "A tag with this label already exists" },
      { status: 409 },
    );
  }

  return NextResponse.json({ tag: result.tag }, { status: 201 });
}
