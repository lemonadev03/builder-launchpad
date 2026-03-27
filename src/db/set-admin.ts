import "dotenv/config";
import { eq } from "drizzle-orm";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

const email = process.argv[2];

if (!email) {
  console.error("Usage: npx tsx src/db/set-admin.ts <email>");
  process.exit(1);
}

async function main() {
  const client = postgres(process.env.DATABASE_URL!);
  const db = drizzle(client, { schema });

  const rows = await db
    .update(schema.user)
    .set({ isPlatformAdmin: true })
    .where(eq(schema.user.email, email))
    .returning({ id: schema.user.id, email: schema.user.email });

  if (rows.length === 0) {
    console.error(`No user found with email: ${email}`);
    await client.end();
    process.exit(1);
  }

  console.log(`Set isPlatformAdmin=true for ${rows[0].email} (${rows[0].id})`);
  await client.end();
}

main();
