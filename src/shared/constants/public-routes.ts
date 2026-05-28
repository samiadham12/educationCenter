/** Routes that do not require an authenticated session. */
export const PUBLIC_API_ROUTES = new Set([
  "GET /api/health",
  "POST /api/auth/login",
  "POST /api/auth/signup",
  "GET /api/auth/signup-years",
]);

export function isPublicApiRoute(method: string, path: string): boolean {
  return PUBLIC_API_ROUTES.has(`${method} ${path}`);
}
