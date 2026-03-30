import {
  eq,
  desc,
  sql,
  and,
  isNotNull,
  count as drizzleCount,
  ilike,
  inArray,
} from "drizzle-orm";
import { db } from "@/db";
import {
  profile,
  profileTag,
  tag,
  membership,
  community,
} from "@/db/schema";

export type DirectoryProfile = {
  userId: string;
  displayName: string;
  username: string;
  tagline: string | null;
  avatarUrl: string | null;
  location: string | null;
  tags: { slug: string; label: string; color: string | null }[];
  communities: {
    communityId: string;
    communityName: string;
    communitySlug: string;
    role: string;
  }[];
};

interface DirectoryOpts {
  limit: number;
  offset: number;
  search?: string;
  tagSlugs?: string[];
  location?: string;
  communityId?: string;
  communityIds?: string[];
}

export async function getDirectoryProfiles(opts: DirectoryOpts) {
  const conditions = [isNotNull(profile.onboardingCompletedAt)];

  // Text search across name, username, bio, tagline
  if (opts.search) {
    const term = `%${opts.search}%`;
    conditions.push(
      sql`(
        ${profile.displayName} ILIKE ${term}
        OR ${profile.username} ILIKE ${term}
        OR ${profile.bio} ILIKE ${term}
        OR ${profile.tagline} ILIKE ${term}
      )`,
    );
  }

  // Location filter
  if (opts.location) {
    conditions.push(ilike(profile.location, `%${opts.location}%`));
  }

  // Tag filter — profiles that have ALL specified tags
  if (opts.tagSlugs && opts.tagSlugs.length > 0) {
    const tagRows = await db
      .select({ id: tag.id })
      .from(tag)
      .where(inArray(tag.slug, opts.tagSlugs));

    if (tagRows.length > 0) {
      const tagIds = tagRows.map((t) => t.id);
      conditions.push(
        sql`${profile.id} IN (
          SELECT ${profileTag.profileId}
          FROM ${profileTag}
          WHERE ${inArray(profileTag.tagId, tagIds)}
          GROUP BY ${profileTag.profileId}
          HAVING COUNT(DISTINCT ${profileTag.tagId}) = ${tagIds.length}
        )`,
      );
    } else {
      // No matching tags — return empty
      return { profiles: [], total: 0 };
    }
  }

  // Community filter — profiles that are active members of specified communities
  const filterCommunityIds = opts.communityIds ?? (opts.communityId ? [opts.communityId] : []);
  if (filterCommunityIds.length > 0) {
    conditions.push(
      sql`${profile.userId} IN (
        SELECT ${membership.userId}
        FROM ${membership}
        WHERE ${inArray(membership.communityId, filterCommunityIds)}
          AND ${membership.status} = 'active'
      )`,
    );
  }

  const where = and(...conditions);

  const profiles = await db
    .select({
      userId: profile.userId,
      displayName: profile.displayName,
      username: profile.username,
      tagline: profile.tagline,
      avatarUrl: profile.avatarUrl,
      location: profile.location,
      createdAt: profile.createdAt,
    })
    .from(profile)
    .where(where)
    .orderBy(desc(profile.createdAt))
    .limit(opts.limit)
    .offset(opts.offset);

  const [totalRow] = await db
    .select({ count: drizzleCount() })
    .from(profile)
    .where(where);

  if (profiles.length === 0) return { profiles: [], total: totalRow?.count ?? 0 };

  // Batch-fetch tags for all profiles
  const profileIds = profiles.map((p) => p.userId);

  const allTags = await db
    .select({
      profileId: profileTag.profileId,
      slug: tag.slug,
      label: tag.label,
      color: tag.color,
    })
    .from(profileTag)
    .innerJoin(tag, eq(profileTag.tagId, tag.id))
    .innerJoin(profile, eq(profileTag.profileId, profile.id))
    .where(inArray(profile.userId, profileIds));

  // Batch-fetch community memberships
  const allMemberships = await db
    .select({
      userId: membership.userId,
      communityId: membership.communityId,
      communityName: community.name,
      communitySlug: community.slug,
      role: membership.role,
    })
    .from(membership)
    .innerJoin(community, eq(membership.communityId, community.id))
    .where(
      and(
        inArray(membership.userId, profileIds),
        eq(membership.status, "active"),
      ),
    );

  // Build profile-to-tags and profile-to-communities maps
  // Tags are keyed by profile.id (not userId), so we need the profile.id → userId mapping
  const profileIdToUserId = new Map<string, string>();
  const userIdToProfileId = new Map<string, string>();

  const profileIdRows = await db
    .select({ id: profile.id, userId: profile.userId })
    .from(profile)
    .where(inArray(profile.userId, profileIds));

  for (const row of profileIdRows) {
    profileIdToUserId.set(row.id, row.userId);
    userIdToProfileId.set(row.userId, row.id);
  }

  const tagsByUserId = new Map<string, typeof allTags>();
  for (const t of allTags) {
    const userId = profileIdToUserId.get(t.profileId);
    if (!userId) continue;
    const list = tagsByUserId.get(userId) ?? [];
    list.push(t);
    tagsByUserId.set(userId, list);
  }

  const commsByUserId = new Map<string, typeof allMemberships>();
  for (const m of allMemberships) {
    const list = commsByUserId.get(m.userId) ?? [];
    list.push(m);
    commsByUserId.set(m.userId, list);
  }

  const enriched: DirectoryProfile[] = profiles.map((p) => ({
    userId: p.userId,
    displayName: p.displayName,
    username: p.username,
    tagline: p.tagline,
    avatarUrl: p.avatarUrl,
    location: p.location,
    tags: (tagsByUserId.get(p.userId) ?? []).map((t) => ({
      slug: t.slug,
      label: t.label,
      color: t.color,
    })),
    communities: (commsByUserId.get(p.userId) ?? []).map((m) => ({
      communityId: m.communityId,
      communityName: m.communityName,
      communitySlug: m.communitySlug,
      role: m.role,
    })),
  }));

  return { profiles: enriched, total: totalRow?.count ?? 0 };
}

export async function getCommunityDirectoryProfiles(
  communityIds: string[],
  opts: Omit<DirectoryOpts, "communityId">,
) {
  if (communityIds.length === 0) return { profiles: [], total: 0 };

  const conditions = [
    isNotNull(profile.onboardingCompletedAt),
    sql`${profile.userId} IN (
      SELECT ${membership.userId}
      FROM ${membership}
      WHERE ${inArray(membership.communityId, communityIds)}
        AND ${membership.status} = 'active'
    )`,
  ];

  if (opts.search) {
    const term = `%${opts.search}%`;
    conditions.push(
      sql`(
        ${profile.displayName} ILIKE ${term}
        OR ${profile.username} ILIKE ${term}
        OR ${profile.bio} ILIKE ${term}
        OR ${profile.tagline} ILIKE ${term}
      )`,
    );
  }

  if (opts.location) {
    conditions.push(ilike(profile.location, `%${opts.location}%`));
  }

  if (opts.tagSlugs && opts.tagSlugs.length > 0) {
    const tagRows = await db
      .select({ id: tag.id })
      .from(tag)
      .where(inArray(tag.slug, opts.tagSlugs));

    if (tagRows.length > 0) {
      const tagIds = tagRows.map((t) => t.id);
      conditions.push(
        sql`${profile.id} IN (
          SELECT ${profileTag.profileId}
          FROM ${profileTag}
          WHERE ${inArray(profileTag.tagId, tagIds)}
          GROUP BY ${profileTag.profileId}
          HAVING COUNT(DISTINCT ${profileTag.tagId}) = ${tagIds.length}
        )`,
      );
    } else {
      return { profiles: [], total: 0 };
    }
  }

  const where = and(...conditions);

  const profiles = await db
    .select({
      userId: profile.userId,
      displayName: profile.displayName,
      username: profile.username,
      tagline: profile.tagline,
      avatarUrl: profile.avatarUrl,
      location: profile.location,
      createdAt: profile.createdAt,
    })
    .from(profile)
    .where(where)
    .orderBy(desc(profile.createdAt))
    .limit(opts.limit)
    .offset(opts.offset);

  const [totalRow] = await db
    .select({ count: drizzleCount() })
    .from(profile)
    .where(where);

  if (profiles.length === 0) return { profiles: [], total: totalRow?.count ?? 0 };

  const profileIds = profiles.map((p) => p.userId);

  const allTags = await db
    .select({
      profileId: profileTag.profileId,
      slug: tag.slug,
      label: tag.label,
      color: tag.color,
    })
    .from(profileTag)
    .innerJoin(tag, eq(profileTag.tagId, tag.id))
    .innerJoin(profile, eq(profileTag.profileId, profile.id))
    .where(inArray(profile.userId, profileIds));

  // For per-community, show which specific community the member belongs to
  const allMemberships = await db
    .select({
      userId: membership.userId,
      communityId: membership.communityId,
      communityName: community.name,
      communitySlug: community.slug,
      role: membership.role,
    })
    .from(membership)
    .innerJoin(community, eq(membership.communityId, community.id))
    .where(
      and(
        inArray(membership.userId, profileIds),
        inArray(membership.communityId, communityIds),
        eq(membership.status, "active"),
      ),
    );

  const profileIdRows = await db
    .select({ id: profile.id, userId: profile.userId })
    .from(profile)
    .where(inArray(profile.userId, profileIds));

  const profileIdToUserId = new Map<string, string>();
  for (const row of profileIdRows) {
    profileIdToUserId.set(row.id, row.userId);
  }

  const tagsByUserId = new Map<string, typeof allTags>();
  for (const t of allTags) {
    const userId = profileIdToUserId.get(t.profileId);
    if (!userId) continue;
    const list = tagsByUserId.get(userId) ?? [];
    list.push(t);
    tagsByUserId.set(userId, list);
  }

  const commsByUserId = new Map<string, typeof allMemberships>();
  for (const m of allMemberships) {
    const list = commsByUserId.get(m.userId) ?? [];
    list.push(m);
    commsByUserId.set(m.userId, list);
  }

  const enriched: DirectoryProfile[] = profiles.map((p) => ({
    userId: p.userId,
    displayName: p.displayName,
    username: p.username,
    tagline: p.tagline,
    avatarUrl: p.avatarUrl,
    location: p.location,
    tags: (tagsByUserId.get(p.userId) ?? []).map((t) => ({
      slug: t.slug,
      label: t.label,
      color: t.color,
    })),
    communities: (commsByUserId.get(p.userId) ?? []).map((m) => ({
      communityId: m.communityId,
      communityName: m.communityName,
      communitySlug: m.communitySlug,
      role: m.role,
    })),
  }));

  return { profiles: enriched, total: totalRow?.count ?? 0 };
}
