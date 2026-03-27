import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireApiAuth } from "@/lib/api-auth";
import { checkCommunityUploadRateLimit } from "@/lib/rate-limit";
import { requireCommunityPermission } from "@/lib/permissions";
import { getCommunityBySlug } from "@/lib/queries/community";
import {
  uploadToS3,
  deleteFromS3,
  getPublicUrl,
  extractKeyFromUrl,
} from "@/lib/s3";
import {
  detectImageType,
  processLogo,
  processBanner,
  generateCommunityS3Key,
  MAX_LOGO_SIZE,
  MAX_BANNER_SIZE,
} from "@/lib/upload";
import { db } from "@/db";
import { community } from "@/db/schema";

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

  const forbidden = await requireCommunityPermission(
    session.user.id,
    c.id,
    "community.upload_branding",
  );
  if (forbidden) return forbidden;

  const rateCheck = checkCommunityUploadRateLimit(session.user.id);
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

  if (type !== "logo" && type !== "banner") {
    return NextResponse.json(
      { error: "Type must be 'logo' or 'banner'" },
      { status: 400 },
    );
  }

  const maxSize = type === "logo" ? MAX_LOGO_SIZE : MAX_BANNER_SIZE;
  if (file.size > maxSize) {
    const maxMB = maxSize / (1024 * 1024);
    return NextResponse.json(
      { error: `File too large. Maximum ${maxMB}MB.` },
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

  const processed =
    type === "logo"
      ? await processLogo(buffer)
      : await processBanner(buffer);

  const key = generateCommunityS3Key(c.id, type);
  await uploadToS3(key, processed, "image/jpeg");
  const url = getPublicUrl(key);

  const oldUrl = type === "logo" ? c.logoUrl : c.bannerUrl;

  const updateField =
    type === "logo" ? { logoUrl: url } : { bannerUrl: url };

  await db
    .update(community)
    .set(updateField)
    .where(eq(community.id, c.id));

  if (oldUrl) {
    const oldKey = extractKeyFromUrl(oldUrl);
    if (oldKey) {
      deleteFromS3(oldKey).catch(() => {});
    }
  }

  return NextResponse.json({ url });
}
