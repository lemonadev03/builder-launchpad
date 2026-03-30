import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireApiAuth } from "@/lib/api-auth";
import { checkUploadRateLimit } from "@/lib/rate-limit";
import {
  uploadToS3,
  deleteFromS3,
  getPublicUrl,
  extractKeyFromUrl,
} from "@/lib/s3";
import {
  detectImageType,
  processLogo,
  generateCompanyLogoS3Key,
  MAX_LOGO_SIZE,
} from "@/lib/upload";
import { db } from "@/db";
import { company } from "@/db/schema";
import { getCompanyByCreatedBy } from "@/lib/queries/company-profile";

export async function POST(request: Request) {
  const { session, response } = await requireApiAuth(request);
  if (response) return response;

  const comp = await getCompanyByCreatedBy(session.user.id);
  if (!comp) {
    return NextResponse.json(
      { error: "No company found. Create one by posting a job listing." },
      { status: 404 },
    );
  }

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
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File required" }, { status: 400 });
  }

  if (file.size > MAX_LOGO_SIZE) {
    const maxMB = MAX_LOGO_SIZE / (1024 * 1024);
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

  const processed = await processLogo(buffer);

  const key = generateCompanyLogoS3Key(comp.id);
  await uploadToS3(key, processed, "image/jpeg");
  const url = getPublicUrl(key);

  // Delete old logo (best-effort)
  if (comp.logoUrl) {
    const oldKey = extractKeyFromUrl(comp.logoUrl);
    if (oldKey) {
      deleteFromS3(oldKey).catch(() => {});
    }
  }

  await db
    .update(company)
    .set({ logoUrl: url })
    .where(eq(company.id, comp.id));

  return NextResponse.json({ url });
}
