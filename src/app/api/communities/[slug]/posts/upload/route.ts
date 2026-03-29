import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { checkPostImageUploadRateLimit } from "@/lib/rate-limit";
import { getCommunityBySlug } from "@/lib/queries/community";
import { getMembership } from "@/lib/queries/membership";
import { uploadToS3, getPublicUrl } from "@/lib/s3";
import {
  detectImageType,
  processPostImage,
  generatePostImageS3Key,
  MAX_POST_IMAGE_SIZE,
} from "@/lib/upload";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function POST(request: Request, { params }: Props) {
  const { slug } = await params;
  const { session, response } = await requireApiAuth(request);
  if (response) return response;

  const c = await getCommunityBySlug(slug);
  if (!c) {
    return NextResponse.json(
      { error: "Community not found" },
      { status: 404 },
    );
  }

  const mem = await getMembership(session.user.id, c.id);
  if (!mem || mem.status !== "active") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rateCheck = checkPostImageUploadRateLimit(session.user.id);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: "Too many uploads. Please try again later." },
      { status: 429 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid form data" },
      { status: 400 },
    );
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File required" }, { status: 400 });
  }

  if (file.size > MAX_POST_IMAGE_SIZE) {
    return NextResponse.json(
      { error: "File too large. Maximum 5MB." },
      { status: 400 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const imageType = detectImageType(buffer);
  if (!imageType) {
    return NextResponse.json(
      { error: "Invalid file type. Accepted: JPEG, PNG, WebP, GIF." },
      { status: 400 },
    );
  }

  const processed = await processPostImage(buffer);
  const key = generatePostImageS3Key(c.id, session.user.id);
  await uploadToS3(key, processed, "image/jpeg");
  const url = getPublicUrl(key);

  return NextResponse.json({ url });
}
