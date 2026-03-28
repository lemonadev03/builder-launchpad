import { NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { requireApiAuth } from "@/lib/api-auth";
import { getCommunityBySlug } from "@/lib/queries/community";
import { requireCommunityPermission } from "@/lib/permissions";
import { createEmailInvites } from "@/lib/queries/invite";
import { checkEmailInviteRateLimit } from "@/lib/rate-limit";

interface Props {
  params: Promise<{ slug: string }>;
}

const emailSchema = z
  .string()
  .email()
  .transform((e) => e.toLowerCase().trim());

const batchSchema = z.object({
  emails: z
    .array(emailSchema)
    .min(1, "At least one email required")
    .max(50, "Maximum 50 emails per batch"),
});

const FROM_EMAIL = "Builder Launchpad <noreply@tools.bscalelabs.com>";

function getResend() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is required");
  }
  return new Resend(process.env.RESEND_API_KEY);
}

function buildInviteEmailHtml(
  communityName: string,
  communityLogoUrl: string | null,
  inviterName: string,
  inviteUrl: string,
) {
  const logoHtml = communityLogoUrl
    ? `<img src="${communityLogoUrl}" alt="${communityName}" width="48" height="48" style="border-radius: 8px; margin-bottom: 16px;" />`
    : "";

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 0;">
      <div style="text-align: center; margin-bottom: 24px;">
        ${logoHtml}
      </div>
      <h2 style="color: #1a1a2e; margin: 0 0 8px;">You're invited to join ${communityName}</h2>
      <p style="color: #555; line-height: 1.6; margin: 0 0 24px;">
        ${inviterName} has invited you to join <strong>${communityName}</strong> on Builder Launchpad.
      </p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${inviteUrl}" style="display: inline-block; padding: 12px 32px; background: #1a1a6e; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 500;">
          Accept Invitation
        </a>
      </div>
      <p style="color: #888; font-size: 13px; line-height: 1.5; margin: 24px 0 0;">
        This invite link does not expire. If you didn't expect this invitation, you can ignore this email.
      </p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0 16px;" />
      <p style="color: #aaa; font-size: 12px; text-align: center;">
        Builder Launchpad — The discovery layer for builder communities
      </p>
    </div>
  `;
}

export async function POST(request: Request, { params }: Props) {
  const { slug } = await params;
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
    "member.invite",
  );
  if (forbidden) return forbidden;

  // Rate limiting per community
  const rateCheck = checkEmailInviteRateLimit(c.id);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: "Too many email invitations. Try again later." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = batchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  // Deduplicate emails
  const uniqueEmails = [...new Set(parsed.data.emails)];

  // Create invite records
  const invites = await createEmailInvites(c.id, session.user.id, uniqueEmails);

  // Send emails via Resend
  const resend = getResend();
  const baseUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000";
  const inviterName = session.user.name;

  const sendResults = await Promise.allSettled(
    invites.map((inv) =>
      resend.emails.send({
        from: FROM_EMAIL,
        to: inv.email!,
        subject: `You're invited to join ${c.name} on Builder Launchpad`,
        html: buildInviteEmailHtml(
          c.name,
          c.logoUrl,
          inviterName,
          `${baseUrl}/invite/${inv.token}`,
        ),
      }),
    ),
  );

  const sent = sendResults.filter((r) => r.status === "fulfilled").length;
  const failed = sendResults.filter((r) => r.status === "rejected").length;

  return NextResponse.json(
    { sent, failed, total: uniqueEmails.length },
    { status: 201 },
  );
}
