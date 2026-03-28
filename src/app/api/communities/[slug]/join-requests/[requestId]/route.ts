import { NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { requireApiAuth } from "@/lib/api-auth";
import { getCommunityBySlug } from "@/lib/queries/community";
import { requireCommunityPermission } from "@/lib/permissions";
import {
  approveJoinRequest,
  rejectJoinRequest,
} from "@/lib/queries/join-request";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema";

interface Props {
  params: Promise<{ slug: string; requestId: string }>;
}

const actionSchema = z.object({
  action: z.enum(["approve", "reject"]),
});

const FROM_EMAIL = "Builder Launchpad <noreply@tools.bscalelabs.com>";

function getResend() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is required");
  }
  return new Resend(process.env.RESEND_API_KEY);
}

export async function PUT(request: Request, { params }: Props) {
  const { slug, requestId } = await params;
  const { session, response } = await requireApiAuth(request);
  if (response) return response;

  const c = await getCommunityBySlug(slug);
  if (!c) {
    return NextResponse.json(
      { error: "Community not found" },
      { status: 404 },
    );
  }

  const forbidden = await requireCommunityPermission(
    session.user.id,
    c.id,
    "community.manage_members",
  );
  if (forbidden) return forbidden;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  if (parsed.data.action === "approve") {
    const result = await approveJoinRequest(requestId, session.user.id);
    if (!result) {
      return NextResponse.json(
        { error: "Request not found or already resolved" },
        { status: 404 },
      );
    }

    // Send approval email using the result we already have
    try {
      const [reqUser] = await db
        .select({ email: user.email, name: user.name })
        .from(user)
        .where(eq(user.id, result.userId))
        .limit(1);

      if (reqUser) {
        await getResend().emails.send({
            from: FROM_EMAIL,
            to: reqUser.email,
            subject: `You've been accepted to ${c.name}!`,
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto;">
                <h2 style="color: #1a1a2e;">Welcome to ${c.name}!</h2>
                <p style="color: #555; line-height: 1.6;">
                  Your request to join <strong>${c.name}</strong> has been approved. You're now a member!
                </p>
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${process.env.BETTER_AUTH_URL || "http://localhost:3000"}/communities/${slug}" style="display: inline-block; padding: 12px 32px; background: #1a1a6e; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 500;">
                    Visit Community
                  </a>
                </div>
              </div>
            `,
          });
        }
    } catch {
      // Email failure is non-blocking
    }

    return NextResponse.json({ request: result });
  }

  // Reject
  const result = await rejectJoinRequest(requestId, session.user.id);
  if (!result) {
    return NextResponse.json(
      { error: "Request not found or already resolved" },
      { status: 404 },
    );
  }

  return NextResponse.json({ request: result });
}
