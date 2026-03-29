import sharp from "sharp";

type ImageType = "jpeg" | "png" | "webp" | "gif";

const MAGIC_BYTES: { type: ImageType; bytes: number[]; offset?: number }[] = [
  { type: "jpeg", bytes: [0xff, 0xd8, 0xff] },
  { type: "png", bytes: [0x89, 0x50, 0x4e, 0x47] },
  { type: "gif", bytes: [0x47, 0x49, 0x46, 0x38] },
  // WebP: starts with RIFF....WEBP
  { type: "webp", bytes: [0x52, 0x49, 0x46, 0x46] },
];

export function detectImageType(buffer: Buffer): ImageType | null {
  for (const { type, bytes, offset = 0 } of MAGIC_BYTES) {
    if (buffer.length < offset + bytes.length) continue;
    const match = bytes.every((b, i) => buffer[offset + i] === b);
    if (match) {
      // Extra check for WebP: bytes 8-11 should be "WEBP"
      if (type === "webp") {
        if (buffer.length < 12) continue;
        const webpTag = buffer.slice(8, 12).toString("ascii");
        if (webpTag !== "WEBP") continue;
      }
      return type;
    }
  }
  return null;
}

export const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_BANNER_SIZE = 10 * 1024 * 1024; // 10MB

export async function processAvatar(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize(400, 400, { fit: "cover", position: "center" })
    .jpeg({ quality: 85 })
    .toBuffer();
}

export async function processBanner(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize(1200, undefined, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();
}

export function generateS3Key(
  userId: string,
  type: "avatar" | "banner",
): string {
  return `profiles/${userId}/${type}-${Date.now()}.jpg`;
}

// ── Community images ────────────────────────────────────────────────

export const MAX_LOGO_SIZE = 5 * 1024 * 1024; // 5MB

export async function processLogo(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize(400, 400, { fit: "cover", position: "center" })
    .jpeg({ quality: 85 })
    .toBuffer();
}

export function generateCommunityS3Key(
  communityId: string,
  type: "logo" | "banner",
): string {
  return `communities/${communityId}/${type}-${Date.now()}.jpg`;
}

// ── Post inline images ─────────────────────────────────────────────

export const MAX_POST_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

export async function processPostImage(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize(1200, undefined, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();
}

export function generatePostImageS3Key(
  communityId: string,
  userId: string,
): string {
  return `posts/${communityId}/${userId}/${Date.now()}.jpg`;
}
