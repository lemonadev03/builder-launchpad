import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { magicLink } from "better-auth/plugins";
import { Resend } from "resend";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { checkMagicLinkRateLimit } from "@/lib/rate-limit";

function getResend() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is required");
  }
  if (!process.env.BETTER_AUTH_SECRET) {
    throw new Error("BETTER_AUTH_SECRET is required");
  }
  return new Resend(process.env.RESEND_API_KEY);
}

const FROM_EMAIL = "Builder Launchpad <noreply@tools.bscalelabs.com>";

function generateUsername(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 26) || "user";
}

async function findAvailableUsername(baseName: string): Promise<string> {
  const candidate = generateUsername(baseName);

  const existing = await db
    .select({ username: schema.profile.username })
    .from(schema.profile)
    .where(eq(schema.profile.username, candidate))
    .limit(1);

  if (existing.length === 0) return candidate;

  // Append random digits until unique
  for (let i = 0; i < 10; i++) {
    const suffix = Math.floor(1000 + Math.random() * 9000).toString();
    const withSuffix = `${candidate.slice(0, 26)}${suffix}`;

    const exists = await db
      .select({ username: schema.profile.username })
      .from(schema.profile)
      .where(eq(schema.profile.username, withSuffix))
      .limit(1);

    if (exists.length === 0) return withSuffix;
  }

  // Fallback: use crypto random
  return `${candidate.slice(0, 22)}${Date.now().toString(36).slice(-8)}`;
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),

  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          const username = await findAvailableUsername(user.name);

          await db.insert(schema.profile).values({
            id: crypto.randomUUID(),
            userId: user.id,
            displayName: user.name,
            username,
          });
        },
      },
    },
  },

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },

  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        const rateCheck = checkMagicLinkRateLimit(email);
        if (!rateCheck.allowed) {
          throw new Error("Too many magic link requests. Please try again later.");
        }

        await getResend().emails.send({
          from: FROM_EMAIL,
          to: email,
          subject: "Sign in to Builder Launchpad",
          html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
              <h2 style="color: #1a1a2e;">Sign in to Builder Launchpad</h2>
              <p>Click the link below to sign in. This link expires in 15 minutes.</p>
              <a href="${url}" style="display: inline-block; padding: 12px 24px; background: #1a1a6e; color: #fff; text-decoration: none; border-radius: 6px;">
                Sign In
              </a>
              <p style="color: #666; font-size: 14px; margin-top: 24px;">
                If you didn't request this, you can safely ignore this email.
              </p>
            </div>
          `,
        });
      },
      expiresIn: 900, // 15 minutes
    }),
  ],
});

export type Session = typeof auth.$Infer.Session;
