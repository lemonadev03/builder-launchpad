import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { isPlatformAdminUser } from "@/lib/platform-admin";
import {
  deletePlatformTag,
  getPlatformTagById,
  updatePlatformTag,
} from "@/lib/queries/platform-tag";
import { updatePlatformTagSchema } from "@/lib/validations/platform-tag";

interface Props {
  params: Promise<{ tagId: string }>;
}

export async function PATCH(request: Request, { params }: Props) {
  const { tagId } = await params;
  const { session, response } = await requireApiAuth(request);
  if (response) return response;

  const allowed = await isPlatformAdminUser(session.user.id);
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const existing = await getPlatformTagById(tagId);
  if (!existing) {
    return NextResponse.json({ error: "Tag not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updatePlatformTagSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const updated = await updatePlatformTag(tagId, parsed.data);
  if (updated && "kind" in updated && updated.kind === "duplicate") {
    return NextResponse.json(
      { error: "A tag with this label already exists" },
      { status: 409 },
    );
  }

  if (!updated) {
    return NextResponse.json({ error: "Tag not found" }, { status: 404 });
  }

  return NextResponse.json({ tag: updated });
}

export async function DELETE(request: Request, { params }: Props) {
  const { tagId } = await params;
  const { session, response } = await requireApiAuth(request);
  if (response) return response;

  const allowed = await isPlatformAdminUser(session.user.id);
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const deleted = await deletePlatformTag(tagId);
  if (!deleted) {
    return NextResponse.json({ error: "Tag not found" }, { status: 404 });
  }

  return NextResponse.json({ deleted });
}
