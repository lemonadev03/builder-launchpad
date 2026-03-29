import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { bookmarkSchema } from "@/lib/validations/reaction";
import {
  addBookmark,
  removeBookmark,
  isBookmarked,
  getUserBookmarks,
} from "@/lib/queries/bookmark";

export async function POST(request: Request) {
  const { session, response } = await requireApiAuth(request);
  if (response) return response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bookmarkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { targetType, targetId } = parsed.data;
  const created = await addBookmark(session.user.id, targetType, targetId);

  return NextResponse.json(
    { bookmark: created, bookmarked: true },
    { status: created ? 201 : 200 },
  );
}

export async function DELETE(request: Request) {
  const { session, response } = await requireApiAuth(request);
  if (response) return response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bookmarkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { targetType, targetId } = parsed.data;
  await removeBookmark(session.user.id, targetType, targetId);

  return NextResponse.json({ bookmarked: false });
}

export async function GET(request: Request) {
  const { session, response } = await requireApiAuth(request);
  if (response) return response;

  const url = new URL(request.url);

  // Check single bookmark status
  const targetType = url.searchParams.get("targetType") as "post" | null;
  const targetId = url.searchParams.get("targetId");

  if (targetType && targetId) {
    const bookmarked = await isBookmarked(
      session.user.id,
      targetType,
      targetId,
    );
    return NextResponse.json({ bookmarked });
  }

  // List all bookmarks
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const limit = Math.min(
    50,
    Math.max(1, parseInt(url.searchParams.get("limit") ?? "20", 10)),
  );
  const offset = (page - 1) * limit;

  const { bookmarks, total } = await getUserBookmarks(session.user.id, {
    limit,
    offset,
  });

  return NextResponse.json({ bookmarks, total, page, limit });
}
