import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireApiAuth } from "@/lib/api-auth";
import { checkUploadRateLimit } from "@/lib/rate-limit";
import { uploadToS3, deleteFromS3, getPublicUrl, extractKeyFromUrl } from "@/lib/s3";
import {
  detectImageType,
  processAvatar,
  processBanner,
  generateS3Key,
  MAX_AVATAR_SIZE,
  MAX_BANNER_SIZE,
} from "@/lib/upload";
import { db } from "@/db";
import { profile } from "@/db/schema";

export async function POST(request: Request) {
  const { session, response } = await requireApiAuth(request);
  if (response) return response;

  const rateCheck = checkUploadRateLimit(session.user.id);
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
  const type = formData.get("type");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File required" }, { status: 400 });
  }

  if (type !== "avatar" && type !== "banner") {
    return NextResponse.json(
      { error: "Type must be 'avatar' or 'banner'" },
      { status: 400 },
    );
  }

  // Size check
  const maxSize = type === "avatar" ? MAX_AVATAR_SIZE : MAX_BANNER_SIZE;
  if (file.size > maxSize) {
    const maxMB = maxSize / (1024 * 1024);
    return NextResponse.json(
      { error: `File too large. Maximum ${maxMB}MB.` },
      { status: 400 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Magic byte validation
  const imageType = detectImageType(buffer);
  if (!imageType) {
    return NextResponse.json(
      { error: "Invalid file type. Accepted: JPEG, PNG, WebP, GIF." },
      { status: 400 },
    );
  }

  // Compress
  const processed =
    type === "avatar"
      ? await processAvatar(buffer)
      : await processBanner(buffer);

  // Upload to S3
  const key = generateS3Key(session.user.id, type);
  await uploadToS3(key, processed, "image/jpeg");
  const url = getPublicUrl(key);

  // Get current profile to delete old image
  const rows = await db
    .select({
      id: profile.id,
      avatarUrl: profile.avatarUrl,
      bannerUrl: profile.bannerUrl,
    })
    .from(profile)
    .where(eq(profile.userId, session.user.id))
    .limit(1);

  if (rows.length === 0) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const currentProfile = rows[0];
  const oldUrl =
    type === "avatar" ? currentProfile.avatarUrl : currentProfile.bannerUrl;

  // Update profile with new URL
  const updateField =
    type === "avatar" ? { avatarUrl: url } : { bannerUrl: url };

  await db
    .update(profile)
    .set(updateField)
    .where(eq(profile.userId, session.user.id));

  // Delete old file from S3 (best-effort)
  if (oldUrl) {
    const oldKey = extractKeyFromUrl(oldUrl);
    if (oldKey) {
      deleteFromS3(oldKey).catch(() => {});
    }
  }

  return NextResponse.json({ url });
}
