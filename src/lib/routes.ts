// Public routes that do not require authentication.
// Everything else is protected by middleware.

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
  "/api/auth/",
];

export function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.includes(pathname)) return true;
  return PUBLIC_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}
