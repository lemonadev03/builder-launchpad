import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getFromS3 } from "@/lib/s3";

// Theme colors — oklch converted to hex for Satori compatibility
export const OG_BG = "#0f1219";
export const OG_CARD_BG = "#171c2a";
export const OG_PRIMARY = "#4d7dff";
export const OG_TEXT = "#f3f4f6";
export const OG_MUTED = "#8b92a5";
export const OG_BORDER = "rgba(255,255,255,0.08)";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const GOOGLE_FONTS_CSS =
  "https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;700&display=swap";

async function fetchGoogleFont(
  weight: number,
): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(GOOGLE_FONTS_CSS, {
      headers: {
        // Request TTF format (not woff2)
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      },
      cache: "force-cache",
    }).then((r) => r.text());

    // Extract the TTF URL for the requested weight
    const regex = new RegExp(
      `@font-face\\s*\\{[^}]*font-weight:\\s*${weight}[^}]*src:\\s*url\\(([^)]+)\\)`,
    );
    const match = css.match(regex);
    if (!match?.[1]) return null;

    return await fetch(match[1], { cache: "force-cache" }).then((r) =>
      r.arrayBuffer(),
    );
  } catch {
    return null;
  }
}

async function loadGeistFallback(): Promise<ArrayBuffer> {
  const path = join(
    process.cwd(),
    "node_modules/next/dist/compiled/@vercel/og/Geist-Regular.ttf",
  );
  const buf = await readFile(path);
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

export async function loadFonts() {
  const [regular, bold] = await Promise.all([
    fetchGoogleFont(400),
    fetchGoogleFont(700),
  ]);

  if (regular && bold) {
    return [
      { name: "Instrument Sans", data: regular, weight: 400 as const, style: "normal" as const },
      { name: "Instrument Sans", data: bold, weight: 700 as const, style: "normal" as const },
    ];
  }

  // Fallback to bundled Geist
  const geist = await loadGeistFallback();
  return [
    { name: "Geist", data: geist, weight: 400 as const, style: "normal" as const },
  ];
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
