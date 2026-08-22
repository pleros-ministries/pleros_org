import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getPpcRewritePath } from "@/lib/ppc-routing";
import {
  getWelcomeAccessCookieOptions,
  WELCOME_ACCESS_COOKIE_NAME,
  WELCOME_ACCESS_MAX_AGE,
} from "@/lib/welcome-access-cookie";

function refreshWelcomeAccessCookie(
  request: NextRequest,
  response: NextResponse,
) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(WELCOME_ACCESS_COOKIE_NAME)?.value;

  if (!pathname.startsWith("/dashboard") || !token) {
    return response;
  }

  response.cookies.set(
    WELCOME_ACCESS_COOKIE_NAME,
    token,
    {
      ...getWelcomeAccessCookieOptions(),
      maxAge: WELCOME_ACCESS_MAX_AGE,
    },
  );

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
    return refreshWelcomeAccessCookie(request, nextResponseWithPathname(request));
  }

  const rewriteUrl = request.nextUrl.clone();
  rewriteUrl.pathname = rewritePath;

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pleros-pathname", request.nextUrl.pathname);

  return refreshWelcomeAccessCookie(
    request,
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
