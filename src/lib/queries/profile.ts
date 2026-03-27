import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { profile, profileTag, tag } from "@/db/schema";
import type { UpdateProfileInput } from "@/lib/validations/profile";

export async function getProfileByUsername(username: string) {
  const rows = await db
    .select()
    .from(profile)
    .where(eq(profile.username, username.toLowerCase()))
    .limit(1);

  if (rows.length === 0) return null;

  const p = rows[0];
  const tags = await db
    .select({ id: tag.id, slug: tag.slug, label: tag.label, color: tag.color })
    .from(profileTag)
    .innerJoin(tag, eq(profileTag.tagId, tag.id))
    .where(eq(profileTag.profileId, p.id));

  return { ...p, tags };
}

export async function getProfileByUserId(userId: string) {
  const rows = await db
    .select()
    .from(profile)
    .where(eq(profile.userId, userId))
    .limit(1);

  if (rows.length === 0) return null;

  const p = rows[0];
  const tags = await db
    .select({ id: tag.id, slug: tag.slug, label: tag.label, color: tag.color })
    .from(profileTag)
    .innerJoin(tag, eq(profileTag.tagId, tag.id))
    .where(eq(profileTag.profileId, p.id));

  return { ...p, tags };
}

export async function updateProfile(
  userId: string,
  data: UpdateProfileInput,
) {
  const { tags: tagSlugs, onboardingCompletedAt, ...fields } = data;

  // Clean empty strings to null for optional fields
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value === "") {
      cleaned[key] = null;
    } else if (value !== undefined) {
      cleaned[key] = value;
    }
  }

  // Set onboarding completion timestamp
  if (onboardingCompletedAt === true) {
    cleaned.onboardingCompletedAt = new Date();
  }

  const rows = await db
    .update(profile)
    .set(cleaned)
    .where(eq(profile.userId, userId))
    .returning();

  if (rows.length === 0) return null;

  const p = rows[0];

  // Sync tags if provided
  if (tagSlugs !== undefined) {
    await db.delete(profileTag).where(eq(profileTag.profileId, p.id));

    if (tagSlugs.length > 0) {
      const normalizedSlugs = tagSlugs.map((s) => s.trim().toLowerCase());

      const matchedTags = await db
        .select({ id: tag.id })
        .from(tag)
        .where(sql`${tag.slug} = ANY(${normalizedSlugs})`);

      if (matchedTags.length > 0) {
        await db.insert(profileTag).values(
          matchedTags.map((t) => ({
            profileId: p.id,
            tagId: t.id,
          })),
        );
      }
    }
  }

  // Return updated profile with tags
  const tags = await db
    .select({ id: tag.id, slug: tag.slug, label: tag.label, color: tag.color })
    .from(profileTag)
    .innerJoin(tag, eq(profileTag.tagId, tag.id))
    .where(eq(profileTag.profileId, p.id));

  return { ...p, tags };
}

export async function checkUsernameAvailable(
  username: string,
  excludeUserId?: string,
) {
  const normalized = username.trim().toLowerCase();
  const rows = await db
    .select({ userId: profile.userId })
    .from(profile)
    .where(eq(profile.username, normalized))
    .limit(1);

  if (rows.length === 0) return true;
  if (excludeUserId && rows[0].userId === excludeUserId) return true;
  return false;
}

export async function getAllTags() {
  return db
    .select({ id: tag.id, slug: tag.slug, label: tag.label, color: tag.color })
    .from(tag)
    .orderBy(tag.label);
}
