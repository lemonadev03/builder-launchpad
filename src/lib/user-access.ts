import { eq } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema";

const DEFAULT_BLOCKED_MESSAGE =
  "Your account has been blocked from Builder Launchpad. Contact support if you believe this is an error.";

export function getPlatformAppealEmail() {
  const email = process.env.PLATFORM_APPEAL_EMAIL?.trim().toLowerCase();
  return email || null;
}

export function getBlockedAccountMessage() {
  const appealEmail = getPlatformAppealEmail();

  if (!appealEmail) {
    return DEFAULT_BLOCKED_MESSAGE;
  }

  return `Your account has been blocked from Builder Launchpad. You can appeal via ${appealEmail}.`;
}

export async function getUserAccessStateById(userId: string) {
  const [row] = await db
    .select({
      id: user.id,
      suspendedAt: user.suspendedAt,
      deletedAt: user.deletedAt,
      isPlatformAdmin: user.isPlatformAdmin,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  return row ?? null;
}

export async function getBlockedUserByEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();

  const [row] = await db
    .select({
      id: user.id,
      suspendedAt: user.suspendedAt,
      deletedAt: user.deletedAt,
    })
    .from(user)
    .where(eq(user.email, normalizedEmail))
    .limit(1);

  if (!row) return null;
  if (!row.suspendedAt && !row.deletedAt) return null;
  return row;
}

export function isUserBlocked(access: {
  suspendedAt: Date | null;
  deletedAt: Date | null;
} | null | undefined) {
  return Boolean(access?.suspendedAt || access?.deletedAt);
}
