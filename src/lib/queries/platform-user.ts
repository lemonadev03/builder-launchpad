import {
  and,
  asc,
  count,
  desc,
  eq,
  isNotNull,
  isNull,
  ne,
  sql,
} from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import {
  membership,
  moderationAction,
  post,
  profile,
  profileTag,
  session,
  tag,
  user,
  community,
} from "@/db/schema";

export type PlatformUserStatus = "active" | "suspended" | "deleted";

export function getPlatformUserStatus(userRow: {
  suspendedAt: Date | null;
  deletedAt: Date | null;
}): PlatformUserStatus {
  if (userRow.deletedAt) return "deleted";
  if (userRow.suspendedAt) return "suspended";
  return "active";
}

export async function getPlatformUsers(opts: {
  limit: number;
  offset: number;
  search?: string;
  status?: PlatformUserStatus | "all";
}) {
  const communitiesCountSq = sql<number>`(
    SELECT count(*)::int FROM membership m
    WHERE m.user_id = ${user.id}
      AND m.status = 'active'
  )`.as("communities_count");

  const conditions = [];

  if (opts.search) {
    const term = `%${opts.search}%`;
    conditions.push(
      sql`(
        ${profile.displayName} ILIKE ${term}
        OR ${profile.username} ILIKE ${term}
        OR ${user.name} ILIKE ${term}
        OR ${user.email} ILIKE ${term}
      )`,
    );
  }

  if (opts.status === "active") {
    conditions.push(and(isNull(user.suspendedAt), isNull(user.deletedAt)));
  } else if (opts.status === "suspended") {
    conditions.push(and(isNotNull(user.suspendedAt), isNull(user.deletedAt)));
  } else if (opts.status === "deleted") {
    conditions.push(isNotNull(user.deletedAt));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      isPlatformAdmin: user.isPlatformAdmin,
      suspendedAt: user.suspendedAt,
      deletedAt: user.deletedAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      displayName: profile.displayName,
      username: profile.username,
      avatarUrl: profile.avatarUrl,
      communitiesCount: communitiesCountSq,
    })
    .from(user)
    .innerJoin(profile, eq(profile.userId, user.id))
    .where(where)
    .orderBy(desc(user.createdAt), asc(profile.username))
    .limit(opts.limit)
    .offset(opts.offset);

  const [totalRow] = await db.select({ count: count() }).from(user).innerJoin(profile, eq(profile.userId, user.id)).where(where);

  return {
    users: rows.map((row) => ({
      ...row,
      status: getPlatformUserStatus(row),
    })),
    total: totalRow?.count ?? 0,
  };
}

export async function getPlatformUserDetail(userId: string) {
  const membershipCommunity = alias(community, "membership_community");
  const postCommunity = alias(community, "post_community");

  const [row] = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      isPlatformAdmin: user.isPlatformAdmin,
      isCompanyPoster: user.isCompanyPoster,
      suspendedAt: user.suspendedAt,
      deletedAt: user.deletedAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      profileId: profile.id,
      displayName: profile.displayName,
      username: profile.username,
      bio: profile.bio,
      tagline: profile.tagline,
      avatarUrl: profile.avatarUrl,
      bannerUrl: profile.bannerUrl,
      location: profile.location,
      educationSchool: profile.educationSchool,
      educationProgram: profile.educationProgram,
      educationYear: profile.educationYear,
      socialLinks: profile.socialLinks,
      onboardingCompletedAt: profile.onboardingCompletedAt,
    })
    .from(user)
    .innerJoin(profile, eq(profile.userId, user.id))
    .where(eq(user.id, userId))
    .limit(1);

  if (!row) return null;

  const [memberships, posts, tags] = await Promise.all([
    db
      .select({
        membershipId: membership.id,
        communityId: membership.communityId,
        communityName: membershipCommunity.name,
        communitySlug: membershipCommunity.slug,
        role: membership.role,
        status: membership.status,
        joinedAt: membership.joinedAt,
      })
      .from(membership)
      .innerJoin(membershipCommunity, eq(membershipCommunity.id, membership.communityId))
      .where(eq(membership.userId, userId))
      .orderBy(desc(membership.joinedAt)),
    db
      .select({
        id: post.id,
        title: post.title,
        slug: post.slug,
        status: post.status,
        createdAt: post.createdAt,
        publishedAt: post.publishedAt,
        archivedAt: post.archivedAt,
        hiddenAt: post.hiddenAt,
        communityName: postCommunity.name,
        communitySlug: postCommunity.slug,
      })
      .from(post)
      .innerJoin(postCommunity, eq(postCommunity.id, post.communityId))
      .where(eq(post.authorId, userId))
      .orderBy(desc(post.createdAt))
      .limit(10),
    db
      .select({
        id: tag.id,
        slug: tag.slug,
        label: tag.label,
        color: tag.color,
      })
      .from(profileTag)
      .innerJoin(tag, eq(profileTag.tagId, tag.id))
      .where(eq(profileTag.profileId, row.profileId)),
  ]);

  return {
    ...row,
    status: getPlatformUserStatus(row),
    memberships,
    posts,
    tags,
  };
}

export async function getPlatformUserById(userId: string) {
  const [row] = await db
    .select({
      id: user.id,
      isPlatformAdmin: user.isPlatformAdmin,
      suspendedAt: user.suspendedAt,
      deletedAt: user.deletedAt,
      email: user.email,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  return row ?? null;
}

export async function suspendPlatformUser(userId: string) {
  const [updated] = await db
    .update(user)
    .set({ suspendedAt: new Date() })
    .where(
      and(
        eq(user.id, userId),
        isNull(user.deletedAt),
        isNull(user.suspendedAt),
      ),
    )
    .returning({
      id: user.id,
      suspendedAt: user.suspendedAt,
      deletedAt: user.deletedAt,
    });

  return updated ?? null;
}

export async function unsuspendPlatformUser(userId: string) {
  const [updated] = await db
    .update(user)
    .set({ suspendedAt: null })
    .where(
      and(
        eq(user.id, userId),
        isNull(user.deletedAt),
        isNotNull(user.suspendedAt),
      ),
    )
    .returning({
      id: user.id,
      suspendedAt: user.suspendedAt,
      deletedAt: user.deletedAt,
    });

  return updated ?? null;
}

function buildDeletedEmail(userId: string) {
  const suffix = userId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 16);
  return `deleted+${suffix}@deleted.builder-launchpad.invalid`;
}

function buildDeletedUsername(userId: string) {
  const suffix = userId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 16).toLowerCase();
  return `deleted-${suffix}`;
}

export async function softDeletePlatformUser(userId: string) {
  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select({
        id: user.id,
        isPlatformAdmin: user.isPlatformAdmin,
        deletedAt: user.deletedAt,
        profileId: profile.id,
      })
      .from(user)
      .innerJoin(profile, eq(profile.userId, user.id))
      .where(eq(user.id, userId))
      .limit(1);

    if (!existing) return null;
    if (existing.deletedAt) return existing;

    const deletedAt = new Date();
    const deletedEmail = buildDeletedEmail(userId);
    const deletedUsername = buildDeletedUsername(userId);

    await tx
      .update(user)
      .set({
        name: "Deleted User",
        email: deletedEmail,
        emailVerified: false,
        image: null,
        isCompanyPoster: false,
        suspendedAt: null,
        deletedAt,
      })
      .where(eq(user.id, userId));

    await tx
      .update(profile)
      .set({
        displayName: "Deleted User",
        username: deletedUsername,
        bio: null,
        tagline: null,
        avatarUrl: null,
        bannerUrl: null,
        location: null,
        educationSchool: null,
        educationProgram: null,
        educationYear: null,
        socialLinks: {},
      })
      .where(eq(profile.userId, userId));

    await tx.delete(profileTag).where(eq(profileTag.profileId, existing.profileId));

    await tx
      .update(membership)
      .set({ status: "suspended" })
      .where(
        and(
          eq(membership.userId, userId),
          ne(membership.status, "suspended"),
        ),
      );

    await tx.delete(session).where(eq(session.userId, userId));

    const [updated] = await tx
      .select({
        id: user.id,
        isPlatformAdmin: user.isPlatformAdmin,
        suspendedAt: user.suspendedAt,
        deletedAt: user.deletedAt,
        email: user.email,
      })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    return updated ?? null;
  });
}

export async function getPlatformUserActionLog(userId: string) {
  return db
    .select({
      id: moderationAction.id,
      action: moderationAction.action,
      createdAt: moderationAction.createdAt,
    })
    .from(moderationAction)
    .where(eq(moderationAction.targetUserId, userId))
    .orderBy(desc(moderationAction.createdAt))
    .limit(20);
}
