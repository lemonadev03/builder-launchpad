import { forbidden, redirect } from "next/navigation";
import { and, count, desc, eq, isNull } from "drizzle-orm";
import { Resend } from "resend";
import { db } from "@/db";
import {
  community,
  platformAdminInvite,
  post,
  user,
} from "@/db/schema";
import { getSession } from "@/lib/session";

const FROM_EMAIL = "Builder Launchpad <noreply@tools.bscalelabs.com>";

function getResend() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is required");
  }
  return new Resend(process.env.RESEND_API_KEY);
}

function buildPlatformAdminEmailHtml(params: {
  adminName: string;
  inviteeEmail: string;
  invitedByName: string;
  existingUser: boolean;
  baseUrl: string;
}) {
  const ctaHref = params.existingUser
    ? `${params.baseUrl}/login?redirect=/platform`
    : `${params.baseUrl}/signup`;
  const ctaLabel = params.existingUser
    ? "Open Platform Admin"
    : "Create Account";

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 0;">
      <h2 style="color: #111827; margin: 0 0 8px;">Platform admin access granted</h2>
      <p style="color: #4b5563; line-height: 1.6; margin: 0 0 16px;">
        ${params.invitedByName} granted <strong>${params.inviteeEmail}</strong> access to the Builder Launchpad platform admin area.
      </p>
      <p style="color: #4b5563; line-height: 1.6; margin: 0 0 24px;">
        ${params.existingUser
          ? "You can now access /platform with your existing account."
          : "Sign up with this email address and your platform admin access will be enabled automatically after account creation."}
      </p>
      <div style="margin: 32px 0; text-align: center;">
        <a href="${ctaHref}" style="display: inline-block; padding: 12px 24px; background: #1f4bd8; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600;">
          ${ctaLabel}
        </a>
      </div>
      <p style="color: #9ca3af; font-size: 12px; line-height: 1.5; margin: 24px 0 0;">
        Builder Launchpad platform admin access is invite-only. If you did not expect this message, contact ${params.adminName}.
      </p>
    </div>
  `;
}

export async function isPlatformAdminUser(userId: string) {
  const [dbUser] = await db
    .select({ isPlatformAdmin: user.isPlatformAdmin })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  return dbUser?.isPlatformAdmin === true;
}

export async function requirePlatformAdminSession() {
  const session = await getSession();

  if (!session) {
    redirect("/login?redirect=/platform");
  }

  const allowed = await isPlatformAdminUser(session.user.id);
  if (!allowed) {
    forbidden();
  }

  return session;
}

export async function getPlatformStats() {
  const [communityRow, userRow, postRow] = await Promise.all([
    db
      .select({ count: count() })
      .from(community)
      .where(isNull(community.archivedAt)),
    db.select({ count: count() }).from(user),
    db
      .select({ count: count() })
      .from(post)
      .where(
        and(eq(post.status, "published"), isNull(post.archivedAt)),
      ),
  ]);

  return {
    totalCommunities: communityRow[0]?.count ?? 0,
    totalUsers: userRow[0]?.count ?? 0,
    totalPosts: postRow[0]?.count ?? 0,
  };
}

export async function listPlatformAdmins() {
  return db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    })
    .from(user)
    .where(eq(user.isPlatformAdmin, true))
    .orderBy(user.name);
}

export async function listPendingPlatformAdminInvites() {
  return db
    .select({
      id: platformAdminInvite.id,
      email: platformAdminInvite.email,
      createdAt: platformAdminInvite.createdAt,
    })
    .from(platformAdminInvite)
    .where(isNull(platformAdminInvite.acceptedAt))
    .orderBy(desc(platformAdminInvite.createdAt));
}

type GrantOrInviteResult =
  | { kind: "granted"; email: string }
  | { kind: "already_admin"; email: string }
  | { kind: "invited"; email: string };

type GrantOrInviteResponse = {
  result: GrantOrInviteResult;
  emailSent: boolean;
};

export async function grantOrInvitePlatformAdmin(params: {
  email: string;
  invitedByUserId: string;
  invitedByName: string;
  baseUrl: string;
}): Promise<GrantOrInviteResponse> {
  const normalizedEmail = params.email.trim().toLowerCase();

  const [existingUser] = await db
    .select({
      id: user.id,
      email: user.email,
      isPlatformAdmin: user.isPlatformAdmin,
    })
    .from(user)
    .where(eq(user.email, normalizedEmail))
    .limit(1);

  let result: GrantOrInviteResult;
  let existingUserAccount = false;

  if (existingUser) {
    existingUserAccount = true;

    if (existingUser.isPlatformAdmin) {
      result = { kind: "already_admin", email: existingUser.email };
    } else {
      await db
        .update(user)
        .set({ isPlatformAdmin: true })
        .where(eq(user.id, existingUser.id));

      await db
        .update(platformAdminInvite)
        .set({ acceptedAt: new Date() })
        .where(eq(platformAdminInvite.email, normalizedEmail));

      result = { kind: "granted", email: existingUser.email };
    }
  } else {
    const [existingInvite] = await db
      .select({ id: platformAdminInvite.id })
      .from(platformAdminInvite)
      .where(eq(platformAdminInvite.email, normalizedEmail))
      .limit(1);

    if (!existingInvite) {
      await db.insert(platformAdminInvite).values({
        id: crypto.randomUUID(),
        email: normalizedEmail,
        invitedBy: params.invitedByUserId,
      });
    }

    result = { kind: "invited", email: normalizedEmail };
  }

  let emailSent = true;

  try {
    await getResend().emails.send({
      from: FROM_EMAIL,
      to: normalizedEmail,
      subject: "Builder Launchpad platform admin access",
      html: buildPlatformAdminEmailHtml({
        adminName: params.invitedByName,
        inviteeEmail: normalizedEmail,
        invitedByName: params.invitedByName,
        existingUser: existingUserAccount,
        baseUrl: params.baseUrl,
      }),
    });
  } catch {
    emailSent = false;
  }

  return { result, emailSent };
}
