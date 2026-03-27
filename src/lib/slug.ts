import { eq } from "drizzle-orm";
import { db } from "@/db";
import { community } from "@/db/schema";

export function generateSlug(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "community"
  );
}

export async function findAvailableSlug(baseName: string): Promise<string> {
  const candidate = generateSlug(baseName);

  const existing = await db
    .select({ slug: community.slug })
    .from(community)
    .where(eq(community.slug, candidate))
    .limit(1);

  if (existing.length === 0) return candidate;

  for (let i = 0; i < 10; i++) {
    const suffix = Math.floor(1000 + Math.random() * 9000).toString();
    const withSuffix = `${candidate.slice(0, 55)}-${suffix}`;

    const exists = await db
      .select({ slug: community.slug })
      .from(community)
      .where(eq(community.slug, withSuffix))
      .limit(1);

    if (exists.length === 0) return withSuffix;
  }

  return `${candidate.slice(0, 50)}-${Date.now().toString(36).slice(-8)}`;
}
