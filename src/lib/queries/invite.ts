import { and, eq, isNull, count } from "drizzle-orm";
import { db } from "@/db";
import { invite, community, membership } from "@/db/schema";

function generateToken(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  // Base64url encoding — URL-safe, 16 chars
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function createInvite(
  communityId: string,
  createdBy: string,
  email?: string,
) {
  const [created] = await db
    .insert(invite)
    .values({
      id: crypto.randomUUID(),
      token: generateToken(),
      communityId,
      createdBy,
      email: email ?? null,
      emailStatus: email ? "sent" : null,
    })
    .returning();

  return created;
}

export async function createEmailInvites(
  communityId: string,
  createdBy: string,
  emails: string[],
) {
  const values = emails.map((email) => ({
    id: crypto.randomUUID(),
    token: generateToken(),
    communityId,
    createdBy,
    email,
    emailStatus: "sent" as const,
  }));

  return db.insert(invite).values(values).returning();
}

export async function getInviteByToken(token: string) {
  const rows = await db
    .select({
      id: invite.id,
      token: invite.token,
      communityId: invite.communityId,
      createdBy: invite.createdBy,
      email: invite.email,
      revokedAt: invite.revokedAt,
      createdAt: invite.createdAt,
    })
    .from(invite)
    .where(eq(invite.token, token))
    .limit(1);

  return rows[0] ?? null;
}

export async function getInvitesByCommunity(communityId: string) {
  return db
    .select({
      id: invite.id,
      token: invite.token,
      email: invite.email,
      emailStatus: invite.emailStatus,
      revokedAt: invite.revokedAt,
      createdAt: invite.createdAt,
    })
    .from(invite)
    .where(
      and(eq(invite.communityId, communityId), isNull(invite.revokedAt)),
    )
    .orderBy(invite.createdAt);
}

export async function revokeInvite(inviteId: string) {
  const rows = await db
    .update(invite)
    .set({ revokedAt: new Date() })
    .where(and(eq(invite.id, inviteId), isNull(invite.revokedAt)))
    .returning();

  return rows[0] ?? null;
}

export async function getActiveInviteCount(communityId: string) {
  const [result] = await db
    .select({ count: count() })
    .from(invite)
    .where(
      and(eq(invite.communityId, communityId), isNull(invite.revokedAt)),
    );

  return result.count;
}

export async function redeemInvite(token: string, userId: string) {
  const inv = await getInviteByToken(token);
  if (!inv || inv.revokedAt) return { error: "invalid" as const };

  // Check community exists and is not archived
  const [comm] = await db
    .select({ id: community.id, slug: community.slug, archivedAt: community.archivedAt })
    .from(community)
    .where(eq(community.id, inv.communityId))
    .limit(1);

  if (!comm || comm.archivedAt) return { error: "invalid" as const };

  // Check if already a member
  const existing = await db
    .select({ id: membership.id })
    .from(membership)
    .where(
      and(
        eq(membership.userId, userId),
        eq(membership.communityId, inv.communityId),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    return { error: "already_member" as const, slug: comm.slug };
  }

  // Create membership and mark email invite as redeemed
  await db.insert(membership).values({
    id: crypto.randomUUID(),
    userId,
    communityId: inv.communityId,
    role: "member",
    status: "active",
  });

  if (inv.email) {
    await db
      .update(invite)
      .set({ emailStatus: "redeemed" })
      .where(eq(invite.id, inv.id));
  }

  return { error: null, slug: comm.slug };
}
