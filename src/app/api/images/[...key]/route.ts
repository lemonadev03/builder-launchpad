import { NextRequest, NextResponse } from "next/server";
import { getFromS3 } from "@/lib/s3";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const { key } = await params;
  const s3Key = key.join("/");

  try {
    const obj = await getFromS3(s3Key);
    const body = obj.Body;
    if (!body) return new NextResponse(null, { status: 404 });

    const bytes = await body.transformToByteArray();

    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": obj.ContentType || "image/jpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (e: unknown) {
    const code = (e as { name?: string }).name;
    if (code === "NoSuchKey") return new NextResponse(null, { status: 404 });
    console.error("Image proxy error:", e);
    return new NextResponse(null, { status: 500 });
  }
}
