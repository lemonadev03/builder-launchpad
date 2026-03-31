import { and, eq, sql, count as drizzleCount } from "drizzle-orm";
import { db } from "@/db";
import { reaction } from "@/db/schema";

export async function addReaction(
  userId: string,
  targetType: "post" | "comment",
  targetId: string,
  reactionType: "like" | "love" | "fire" | "insightful",
) {
  const [created] = await db
    .insert(reaction)
    .values({
      id: crypto.randomUUID(),
      userId,
      targetType,
      targetId,
      reactionType,
    })
    .onConflictDoNothing()
    .returning();

  return created ?? null;
}

export async function removeReaction(
  userId: string,
  targetType: "post" | "comment",
  targetId: string,
  reactionType: "like" | "love" | "fire" | "insightful",
) {
  const [deleted] = await db
    .delete(reaction)
    .where(
      and(
        eq(reaction.userId, userId),
        eq(reaction.targetType, targetType),
        eq(reaction.targetId, targetId),
        eq(reaction.reactionType, reactionType),
      ),
    )
    .returning();

  return deleted ?? null;
}

export async function getReactionCounts(
  targetType: "post" | "comment",
  targetId: string,
) {
  const rows = await db
    .select({
      reactionType: reaction.reactionType,
      count: drizzleCount(),
    })
    .from(reaction)
    .where(
      and(
        eq(reaction.targetType, targetType),
        eq(reaction.targetId, targetId),
      ),
    )
    .groupBy(reaction.reactionType);

  const counts: Record<string, number> = {};
  for (const row of rows) {
    counts[row.reactionType] = row.count;
  }
  return counts;
}

export async function getUserReactions(
  userId: string,
  targetType: "post" | "comment",
  targetId: string,
) {
  const rows = await db
    .select({ reactionType: reaction.reactionType })
    .from(reaction)
    .where(
      and(
        eq(reaction.userId, userId),
        eq(reaction.targetType, targetType),
        eq(reaction.targetId, targetId),
      ),
    );

  return rows.map((r) => r.reactionType);
}

/**
 * Batch-fetch user reactions for multiple targets in 1 query.
 * Returns Map<targetId, reactionType[]>.
 */
export async function getUserReactionsBatch(
  userId: string,
  targetType: "post" | "comment",
  targetIds: string[],
) {
  if (targetIds.length === 0) return new Map<string, string[]>();

  const rows = await db
    .select({
      targetId: reaction.targetId,
      reactionType: reaction.reactionType,
    })
    .from(reaction)
    .where(
      and(
        eq(reaction.userId, userId),
        eq(reaction.targetType, targetType),
        sql`${reaction.targetId} IN (${sql.join(
          targetIds.map((id) => sql`${id}`),
          sql`, `,
        )})`,
      ),
    );

  const map = new Map<string, string[]>();
  for (const row of rows) {
    const arr = map.get(row.targetId) ?? [];
    arr.push(row.reactionType);
    map.set(row.targetId, arr);
  }
  return map;
}

export async function getReactionCountsBatch(
  targetType: "post" | "comment",
  targetIds: string[],
) {
  if (targetIds.length === 0) return new Map<string, Record<string, number>>();

  const rows = await db
    .select({
      targetId: reaction.targetId,
      reactionType: reaction.reactionType,
      count: drizzleCount(),
    })
    .from(reaction)
    .where(
      and(
        eq(reaction.targetType, targetType),
        sql`${reaction.targetId} IN (${sql.join(
          targetIds.map((id) => sql`${id}`),
          sql`, `,
        )})`,
      ),
    )
    .groupBy(reaction.targetId, reaction.reactionType);

  const map = new Map<string, Record<string, number>>();
  for (const row of rows) {
    const counts = map.get(row.targetId) ?? {};
    counts[row.reactionType] = row.count;
    map.set(row.targetId, counts);
  }
  return map;
}
