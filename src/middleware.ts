import createIntlMiddleware from "next-intl/middleware";
import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import { STAFF_ROLES, type Role } from "@/shared/constants/roles";
import { stripLocalePrefix } from "@/shared/i18n/path-utils";

const intlMiddleware = createIntlMiddleware(routing);

export async function middleware(req: NextRequest) {
  const intlResponse = intlMiddleware(req);

  const isRedirect =
    intlResponse.status === 307 ||
    intlResponse.status === 308 ||
    intlResponse.headers.get("location");

  if (isRedirect) {
    return intlResponse;
  }

  const { locale, pathname } = stripLocalePrefix(req.nextUrl.pathname);
  const needsAuth =
    pathname.startsWith("/admin") || pathname.startsWith("/student");

  if (!needsAuth) {
    return intlResponse;
  }

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
  });

  if (!token?.sub) {
    return NextResponse.redirect(
      new URL(`/${locale}/login`, req.nextUrl.origin),
    );
  }

  const role = (token.role as Role | undefined) ?? "STUDENT";
  if (pathname.startsWith("/admin") && !STAFF_ROLES.includes(role)) {
    return NextResponse.redirect(
      new URL(`/${locale}/student`, req.nextUrl.origin),
    );
  }

  return intlResponse;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
