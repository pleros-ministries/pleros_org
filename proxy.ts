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
