import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Convert legacy direct S3 URLs to proxy URLs.
 * Railway Object Storage buckets are private — images must be served
 * through /api/images/[...key].
 */
export function imageUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("/api/images/")) return url;
  const match = url.match(/^https?:\/\/[^/]*storageapi\.dev\/[^/]+\/(.+)$/);
  if (match) return `/api/images/${match[1]}`;
  return url;
}
