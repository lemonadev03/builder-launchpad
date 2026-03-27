import { config } from "dotenv";
config({ path: ".env.local" });
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { tag } from "./schema";

const TAGS = [
  { slug: "web-dev", label: "Web Development", color: "#3b82f6" },
  { slug: "mobile-dev", label: "Mobile Development", color: "#8b5cf6" },
  { slug: "ai-ml", label: "AI / Machine Learning", color: "#f59e0b" },
  { slug: "data-science", label: "Data Science", color: "#10b981" },
  { slug: "devops", label: "DevOps & Cloud", color: "#06b6d4" },
  { slug: "cybersecurity", label: "Cybersecurity", color: "#ef4444" },
  { slug: "blockchain", label: "Blockchain & Web3", color: "#a855f7" },
  { slug: "ui-ux", label: "UI/UX Design", color: "#ec4899" },
  { slug: "game-dev", label: "Game Development", color: "#f97316" },
  { slug: "embedded", label: "Embedded & IoT", color: "#14b8a6" },
  { slug: "open-source", label: "Open Source", color: "#22c55e" },
  { slug: "product", label: "Product Management", color: "#6366f1" },
  { slug: "startups", label: "Startups & Entrepreneurship", color: "#e11d48" },
  { slug: "community", label: "Community Building", color: "#0ea5e9" },
  { slug: "content-writing", label: "Content & Technical Writing", color: "#84cc16" },
];

async function seed() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  const client = postgres(process.env.DATABASE_URL);
  const db = drizzle(client);

  console.log("Seeding tags...");

  await db
    .insert(tag)
    .values(
      TAGS.map((t) => ({
        id: crypto.randomUUID(),
        ...t,
      })),
    )
    .onConflictDoNothing({ target: tag.slug });

  console.log(`Seeded ${TAGS.length} tags.`);
  await client.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
