import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getBlockedAccountMessage,
  getUserAccessStateById,
  isUserBlocked,
} from "@/lib/user-access";

export async function getApiSession(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) return null;

  const access = await getUserAccessStateById(session.user.id);
  if (isUserBlocked(access)) {
    return null;
  }

  return session;
}

/**
 * Guard for API route handlers that require authentication.
 * Returns the session if authenticated, or a 401 response.
 */
export async function requireApiAuth(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return {
      session: null,
      response: NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      ),
    } as const;
  }

  const access = await getUserAccessStateById(session.user.id);
  if (isUserBlocked(access)) {
    return {
      session: null,
      response: NextResponse.json(
        { error: getBlockedAccountMessage() },
        { status: 403 },
      ),
    } as const;
  }

  return { session, response: null } as const;
}
