import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getFromS3 } from "@/lib/s3";

// Theme colors — oklch converted to hex for Satori compatibility
export const OG_BG = "#0c0f17";
export const OG_CARD_BG = "#151a28";
export const OG_CARD_BG_END = "#181e33";
export const OG_PRIMARY = "#4d7dff";
export const OG_ACCENT_END = "#7b5cff";
export const OG_TEXT = "#f3f4f6";
export const OG_MUTED = "#8b92a5";
export const OG_BORDER = "rgba(255,255,255,0.06)";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

let fontCache: { name: string; data: ArrayBuffer; weight: 400; style: "normal" }[] | null = null;

export async function loadFonts() {
  if (fontCache) return fontCache;

  const path = join(
    process.cwd(),
    "node_modules/next/dist/compiled/@vercel/og/Geist-Regular.ttf",
  );
  const buf = await readFile(path);
  const data = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);

  fontCache = [{ name: "Geist", data, weight: 400 as const, style: "normal" as const }];
  return fontCache;
}

/**
 * Resolve an image URL to a data: URI by fetching directly from S3.
 * Falls back to absolute URL for external images.
 * Returns null if the image can't be loaded.
 */
export async function resolveImageSrc(
  url: string | null | undefined,
): Promise<string | null> {
  if (!url) return null;

  // External URL — pass through as-is
  if (url.startsWith("http")) return url;

  // S3 proxy path — fetch directly from S3 and encode as data URI
  const proxyPrefix = "/api/images/";
  if (url.startsWith(proxyPrefix)) {
    const key = url.slice(proxyPrefix.length);
    try {
      const res = await getFromS3(key);
      const contentType = res.ContentType ?? "image/png";
      const bytes = await res.Body?.transformToByteArray();
      if (!bytes) return null;
      const b64 = Buffer.from(bytes).toString("base64");
      return `data:${contentType};base64,${b64}`;
    } catch {
      return null;
    }
  }

  // Other relative path — try absolute URL
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base}${url.startsWith("/") ? "" : "/"}${url}`;
}

export function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}
