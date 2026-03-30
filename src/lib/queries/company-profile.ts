import { eq } from "drizzle-orm";
import { db } from "@/db";
import { company } from "@/db/schema";

export async function getCompanyByCreatedBy(userId: string) {
  const rows = await db
    .select()
    .from(company)
    .where(eq(company.createdBy, userId))
    .limit(1);

  return rows[0] ?? null;
}

export async function createCompanyForPoster(
  userId: string,
  data: { name: string; website?: string; description?: string },
) {
  const [created] = await db
    .insert(company)
    .values({
      id: crypto.randomUUID(),
      name: data.name,
      website: data.website || null,
      description: data.description || null,
      createdBy: userId,
    })
    .returning();

  return created;
}

export async function updateCompanyProfile(
  companyId: string,
  userId: string,
  data: Record<string, unknown>,
) {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === "") {
      cleaned[key] = null;
    } else if (value !== undefined) {
      cleaned[key] = value;
    }
  }

  const rows = await db
    .update(company)
    .set(cleaned)
    .where(eq(company.id, companyId))
    .returning();

  return rows[0] ?? null;
}
