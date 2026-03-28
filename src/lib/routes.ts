// Public routes that do not require authentication.
// Everything else is protected by the proxy.

export const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/signup",
  "/communities",
  "/directory",
  "/jobs",
];

// Dynamic public routes — matched by prefix.
export const PUBLIC_ROUTE_PREFIXES = [
  "/profile/",
  "/communities/",
  "/invite/",
  "/api/auth/",
  "/api/profiles/",
  "/api/tags",
  "/api/communities",
  "/api/invites/",
];

export function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.includes(pathname)) return true;
  return PUBLIC_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}
