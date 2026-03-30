import { asc, count, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { profileTag, tag } from "@/db/schema";
import type {
  CreatePlatformTagInput,
  UpdatePlatformTagInput,
} from "@/lib/validations/platform-tag";

export type PlatformTagRecord = {
  id: string;
  slug: string;
  label: string;
  color: string | null;
  profilesCount: number;
  createdAt: Date;
};

function slugifyTagLabel(label: string) {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

function normalizeColor(color: string | undefined) {
  const trimmed = color?.trim();
  return trimmed ? trimmed.toLowerCase() : null;
}

async function findTagByNormalizedLabel(labelValue: string) {
  const normalizedLabel = labelValue.trim().toLowerCase();

  const [existing] = await db
    .select({ id: tag.id })
    .from(tag)
    .where(sql`lower(${tag.label}) = ${normalizedLabel}`)
    .limit(1);

  return existing ?? null;
}

export async function listPlatformTags(): Promise<PlatformTagRecord[]> {
  return db
    .select({
      id: tag.id,
      slug: tag.slug,
      label: tag.label,
      color: tag.color,
      createdAt: tag.createdAt,
      profilesCount: count(profileTag.profileId),
    })
    .from(tag)
    .leftJoin(profileTag, eq(profileTag.tagId, tag.id))
    .groupBy(tag.id, tag.slug, tag.label, tag.color, tag.createdAt)
    .orderBy(asc(tag.label));
}

export async function getPlatformTagById(tagId: string) {
  const [existing] = await db
    .select({
      id: tag.id,
      slug: tag.slug,
      label: tag.label,
      color: tag.color,
      createdAt: tag.createdAt,
    })
    .from(tag)
    .where(eq(tag.id, tagId))
    .limit(1);

  return existing ?? null;
}

export async function createPlatformTag(input: CreatePlatformTagInput) {
  const slug = slugifyTagLabel(input.label);

  if (!slug) {
    throw new Error("Could not generate a valid slug for this tag");
  }

  const duplicateLabel = await findTagByNormalizedLabel(input.label);
  if (duplicateLabel) {
    return { kind: "duplicate" as const };
  }

  const [duplicate] = await db
    .select({ id: tag.id })
    .from(tag)
    .where(eq(tag.slug, slug))
    .limit(1);

  if (duplicate) {
    return { kind: "duplicate" as const };
  }

  const [created] = await db
    .insert(tag)
    .values({
      id: crypto.randomUUID(),
      slug,
      label: input.label.trim(),
      color: normalizeColor(input.color),
    })
    .returning({
      id: tag.id,
      slug: tag.slug,
      label: tag.label,
      color: tag.color,
      createdAt: tag.createdAt,
    });

  return {
    kind: "created" as const,
    tag: {
      ...created,
      profilesCount: 0,
    },
  };
}

export async function updatePlatformTag(
  tagId: string,
  input: UpdatePlatformTagInput,
) {
  const duplicateLabel = await findTagByNormalizedLabel(input.label);
  if (duplicateLabel && duplicateLabel.id !== tagId) {
    return { kind: "duplicate" as const };
  }

  const [updated] = await db
    .update(tag)
    .set({
      label: input.label.trim(),
      color: normalizeColor(input.color),
    })
    .where(eq(tag.id, tagId))
    .returning({
      id: tag.id,
      slug: tag.slug,
      label: tag.label,
      color: tag.color,
      createdAt: tag.createdAt,
    });

  if (!updated) return null;

  const [usage] = await db
    .select({ profilesCount: count(profileTag.profileId) })
    .from(profileTag)
    .where(eq(profileTag.tagId, tagId));

  return {
    ...updated,
    profilesCount: usage?.profilesCount ?? 0,
  };
}

export async function deletePlatformTag(tagId: string) {
  const [usage] = await db
    .select({ profilesCount: count(profileTag.profileId) })
    .from(profileTag)
    .where(eq(profileTag.tagId, tagId));

  const [deleted] = await db
    .delete(tag)
    .where(eq(tag.id, tagId))
    .returning({
      id: tag.id,
      slug: tag.slug,
      label: tag.label,
    });

  if (!deleted) return null;

  return {
    ...deleted,
    profilesCount: usage?.profilesCount ?? 0,
  };
}
