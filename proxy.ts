import { getSessionCookie } from "better-auth/cookies";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getPpcRewritePath } from "@/lib/ppc-routing";
import { WELCOME_ACCESS_COOKIE_NAME } from "@/lib/welcome-access-cookie";

function retireLegacyWelcomeAccessCookie(response: NextResponse) {
  response.cookies.set(WELCOME_ACCESS_COOKIE_NAME, "", {
    path: "/",
    maxAge: 0,
  });

  return response;
}

function nextResponseWithPathname(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pleros-pathname", request.nextUrl.pathname);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export function proxy(request: NextRequest) {
  const host = request.headers.get("host");

  const rewritePath = getPpcRewritePath(host, request.nextUrl.pathname);

  if (!rewritePath) {
    // Optimistic gate: a dashboard request with no session cookie goes straight to
    // /login. Under Cache Components the layout streams, so its own redirect would
    // arrive after the shell; the layout stays the real check for every request.
    const { pathname, search } = request.nextUrl;
    if ((pathname === "/dashboard" || pathname.startsWith("/dashboard/")) && !getSessionCookie(request)) {
      const login = request.nextUrl.clone();
      login.pathname = "/login";
      login.search = `?returnTo=${encodeURIComponent(pathname + search)}`;
      return retireLegacyWelcomeAccessCookie(NextResponse.redirect(login));
    }
    return retireLegacyWelcomeAccessCookie(nextResponseWithPathname(request));
  }

  const rewriteUrl = request.nextUrl.clone();
  rewriteUrl.pathname = rewritePath;

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pleros-pathname", request.nextUrl.pathname);

  return retireLegacyWelcomeAccessCookie(
    NextResponse.rewrite(rewriteUrl, {
      request: {
        headers: requestHeaders,
      },
    }),
  );
}

export const config = {
  matcher: ["/:path*"],
};
