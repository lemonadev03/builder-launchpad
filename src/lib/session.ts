import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getUserAccessStateById, isUserBlocked } from "@/lib/user-access";

/**
 * Get the current session in server components and API routes.
 * Returns null if unauthenticated.
 */
export async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) return null;

  const access = await getUserAccessStateById(session.user.id);
  if (isUserBlocked(access)) {
    redirect("/blocked");
  }

  return session;
}

/**
 * Get the current session or throw. Use in protected server components
 * where middleware guarantees auth.
 */
export async function requireSession() {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}
