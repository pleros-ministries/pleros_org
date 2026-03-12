import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  canAccessPpcPath,
  getLogicalPpcPath,
  getRoleHomePath,
  isPublicPpcPath,
  toExternalPpcPath,
} from "@/lib/ppc-access";
import { decodeDemoSession, DEMO_AUTH_COOKIE_NAME, isDemoAuthEnabled } from "@/lib/demo-auth-session";
import { getPpcRewritePath } from "@/lib/ppc-routing";

export function proxy(request: NextRequest) {
  const host = request.headers.get("host");
  const logicalPpcPath = getLogicalPpcPath(host, request.nextUrl.pathname);

  if (logicalPpcPath && isDemoAuthEnabled()) {
    const session = decodeDemoSession(request.cookies.get(DEMO_AUTH_COOKIE_NAME)?.value);

    if (!session && !isPublicPpcPath(logicalPpcPath)) {
      const signInUrl = request.nextUrl.clone();
      signInUrl.pathname = toExternalPpcPath(host, "/sign-in");
      signInUrl.searchParams.set("returnTo", logicalPpcPath);

      return NextResponse.redirect(signInUrl);
    }

    if (session) {
      if (logicalPpcPath === "/sign-in") {
        const homeUrl = request.nextUrl.clone();
        homeUrl.pathname = toExternalPpcPath(host, getRoleHomePath(session.user.role));
        homeUrl.search = "";

        return NextResponse.redirect(homeUrl);
      }

      if (logicalPpcPath === "/" && getRoleHomePath(session.user.role) !== "/") {
        const homeUrl = request.nextUrl.clone();
        homeUrl.pathname = toExternalPpcPath(host, getRoleHomePath(session.user.role));
        homeUrl.search = "";

        return NextResponse.redirect(homeUrl);
      }

      if (!canAccessPpcPath(session.user.role, logicalPpcPath)) {
        const forbiddenUrl = request.nextUrl.clone();
        forbiddenUrl.pathname = toExternalPpcPath(host, "/forbidden");
        forbiddenUrl.search = "";

        return NextResponse.redirect(forbiddenUrl);
      }
    }
  }

  const rewritePath = getPpcRewritePath(
    host,
    request.nextUrl.pathname,
  );

  if (!rewritePath) {
    return NextResponse.next();
  }

  const rewriteUrl = request.nextUrl.clone();
  rewriteUrl.pathname = rewritePath;

  return NextResponse.rewrite(rewriteUrl);
}

export const config = {
  matcher: ["/:path*"],
};
