import { and, eq, count as drizzleCount, sql, gte } from "drizzle-orm";
import { db } from "@/db";
import { flag } from "@/db/schema";

export async function createFlag(
  userId: string,
  targetType: "post" | "comment",
  targetId: string,
  reason: "spam" | "harassment" | "off_topic" | "other",
  communityId: string,
  description?: string,
) {
  const [created] = await db
    .insert(flag)
    .values({
      id: crypto.randomUUID(),
      userId,
      targetType,
      targetId,
      reason,
      communityId,
      description: description || null,
    })
    .onConflictDoNothing()
    .returning();

  return created ?? null;
}

export async function hasUserFlagged(
  userId: string,
  targetType: "post" | "comment",
  targetId: string,
): Promise<boolean> {
  const rows = await db
    .select({ id: flag.id })
    .from(flag)
    .where(
      and(
        eq(flag.userId, userId),
        eq(flag.targetType, targetType),
        eq(flag.targetId, targetId),
      ),
    )
    .limit(1);

  return rows.length > 0;
}

export async function getFlagCount(
  targetType: "post" | "comment",
  targetId: string,
): Promise<number> {
  const [row] = await db
    .select({ count: drizzleCount() })
    .from(flag)
    .where(
      and(
        eq(flag.targetType, targetType),
        eq(flag.targetId, targetId),
        eq(flag.status, "open"),
      ),
    );

  return row?.count ?? 0;
}

export async function getFlagCountsBatch(
  targetType: "post" | "comment",
  targetIds: string[],
): Promise<Map<string, number>> {
  if (targetIds.length === 0) return new Map();

  const rows = await db
    .select({
      targetId: flag.targetId,
      count: drizzleCount(),
    })
    .from(flag)
    .where(
      and(
        eq(flag.targetType, targetType),
        eq(flag.status, "open"),
        sql`${flag.targetId} = ANY(${targetIds})`,
      ),
    )
    .groupBy(flag.targetId);

  const map = new Map<string, number>();
  for (const row of rows) {
    map.set(row.targetId, row.count);
  }
  return map;
}

export async function getUserFlaggedTargets(
  userId: string,
  targetType: "post" | "comment",
  targetIds: string[],
): Promise<Set<string>> {
  if (targetIds.length === 0) return new Set();

  const rows = await db
    .select({ targetId: flag.targetId })
    .from(flag)
    .where(
      and(
        eq(flag.userId, userId),
        eq(flag.targetType, targetType),
        sql`${flag.targetId} = ANY(${targetIds})`,
      ),
    );

  return new Set(rows.map((r) => r.targetId));
}

export async function getUserDailyFlagCount(userId: string): Promise<number> {
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [row] = await db
    .select({ count: drizzleCount() })
    .from(flag)
    .where(and(eq(flag.userId, userId), gte(flag.createdAt, dayAgo)));

  return row?.count ?? 0;
}
